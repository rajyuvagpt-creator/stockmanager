import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { chatWithAI } from '@/lib/gemini'
import { CHATBOT_SYSTEM_PROMPT } from '@/ai/prompts/chatbot-system'
import { updateInventoryStock } from '@/ai/actions/inventory-actions'
import { logExpense } from '@/ai/actions/expense-actions'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')

  if (sessionId) {
    const chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    })
    if (!chatSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    })
    return NextResponse.json(messages)
  }

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id, platform: 'WEB' },
    orderBy: { startedAt: 'desc' },
    take: 10,
  })
  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { message, sessionId } = body

  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

  let chatSession
  if (sessionId) {
    chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    })
  }

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId: session.user.id, platform: 'WEB' },
    })
  }

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: chatSession.id },
    orderBy: { timestamp: 'asc' },
    take: 20,
  })

  const aiResponse = await chatWithAI(
    CHATBOT_SYSTEM_PROMPT,
    message,
    history.map((h) => ({ role: h.role, content: h.content }))
  )

  // Parse and execute action blocks
  let actionTaken: string | null = null
  const actionMatch = aiResponse.match(/```action\n([\s\S]*?)\n```/)
  if (actionMatch) {
    try {
      const action = JSON.parse(actionMatch[1])
      const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })

      if (action.type === 'UPDATE_STOCK' && shop) {
        await updateInventoryStock({
          ...action.data,
          shopId: shop.id,
        })
        actionTaken = `Updated stock: ${JSON.stringify(action.data)}`
      } else if (action.type === 'LOG_EXPENSE') {
        await logExpense({ ...action.data, userId: session.user.id })
        actionTaken = `Logged expense: ${JSON.stringify(action.data)}`
      }
    } catch {
      // Action parsing failed, continue
    }
  }

  await prisma.chatMessage.createMany({
    data: [
      { sessionId: chatSession.id, role: 'user', content: message },
      { sessionId: chatSession.id, role: 'assistant', content: aiResponse, actionTaken },
    ],
  })

  return NextResponse.json({
    response: aiResponse,
    sessionId: chatSession.id,
    actionTaken,
  })
}
