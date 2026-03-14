import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { chatWithAI } from '@/lib/gemini'
import { CHATBOT_SYSTEM_PROMPT } from '@/ai/prompts/chatbot-system'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { message, history = [] } = body

  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const response = await chatWithAI(CHATBOT_SYSTEM_PROMPT, message, history)
  return NextResponse.json({ response })
}
