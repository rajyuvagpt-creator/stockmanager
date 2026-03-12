import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const expenseSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().min(0),
  date: z.string(),
  receiptUrl: z.string().optional(),
  recurring: z.boolean().default(false),
  frequency: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const now = new Date()
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1
  const targetYear = year ? parseInt(year) : now.getFullYear()

  const startDate = new Date(targetYear, targetMonth - 1, 1)
  const endDate = new Date(targetYear, targetMonth, 0)

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'desc' },
  })

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const byCategory = expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    },
    {} as Record<string, number>
  )

  return NextResponse.json({ expenses, total, byCategory })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const validated = expenseSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.flatten() }, { status: 400 })
  }

  const expense = await prisma.expense.create({
    data: {
      userId: session.user.id,
      ...validated.data,
      date: new Date(validated.data.date),
    },
  })

  return NextResponse.json(expense, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const expense = await prisma.expense.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

  await prisma.expense.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
