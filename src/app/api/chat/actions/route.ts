import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateInventoryStock } from '@/ai/actions/inventory-actions'
import { logExpense } from '@/ai/actions/expense-actions'
import { createOrder } from '@/ai/actions/order-actions'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, data } = body

  if (!type || !data) {
    return NextResponse.json({ error: 'type and data required' }, { status: 400 })
  }

  try {
    switch (type) {
      case 'UPDATE_STOCK': {
        const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
        if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
        const result = await updateInventoryStock({ ...data, shopId: shop.id })
        return NextResponse.json({ success: true, result, action: 'UPDATE_STOCK' })
      }

      case 'LOG_EXPENSE': {
        const result = await logExpense({ ...data, userId: session.user.id })
        return NextResponse.json({ success: true, result, action: 'LOG_EXPENSE' })
      }

      case 'CREATE_ORDER': {
        const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
        if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
        const result = await createOrder({ ...data, shopId: shop.id })
        return NextResponse.json({ success: true, result, action: 'CREATE_ORDER' })
      }

      default:
        return NextResponse.json({ error: `Unknown action type: ${type}` }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
