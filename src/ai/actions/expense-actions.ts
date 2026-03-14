import { prisma } from '@/lib/prisma'

interface LogExpenseData {
  userId: string
  category: string
  amount: number
  description?: string
  date?: Date
  receiptUrl?: string
  recurring?: boolean
  frequency?: string
}

export async function logExpense(data: LogExpenseData) {
  const expense = await prisma.expense.create({
    data: {
      userId: data.userId,
      category: data.category,
      amount: data.amount,
      description: data.description,
      date: data.date || new Date(),
      receiptUrl: data.receiptUrl,
      recurring: data.recurring || false,
      frequency: data.frequency,
    },
  })
  return expense
}

export async function getExpenseSummary(userId: string, month?: number, year?: number) {
  const now = new Date()
  const targetMonth = month || now.getMonth() + 1
  const targetYear = year || now.getFullYear()

  const startDate = new Date(targetYear, targetMonth - 1, 1)
  const endDate = new Date(targetYear, targetMonth, 0)

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
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

  return { expenses, total, byCategory, month: targetMonth, year: targetYear }
}
