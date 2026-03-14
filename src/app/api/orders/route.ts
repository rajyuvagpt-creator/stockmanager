import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const orderSchema = z.object({
  wholesalerId: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
    })
  ),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  if (session.user.role === 'SHOPKEEPER') {
    const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const orders = await prisma.order.findMany({
      where: {
        shopId: shop.id,
        ...(status ? { status: status as 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' } : {}),
      },
      include: {
        items: true,
        wholesaler: { include: { user: true } },
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  }

  if (session.user.role === 'WHOLESALER') {
    const wholesaler = await prisma.wholesaler.findUnique({ where: { userId: session.user.id } })
    if (!wholesaler) return NextResponse.json({ error: 'Wholesaler not found' }, { status: 404 })

    const orders = await prisma.order.findMany({
      where: {
        wholesalerId: wholesaler.id,
        ...(status ? { status: status as 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' } : {}),
      },
      include: {
        items: true,
        shop: { include: { user: true } },
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  }

  return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'SHOPKEEPER') {
    return NextResponse.json({ error: 'Only shopkeepers can create orders' }, { status: 403 })
  }

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const validated = orderSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.flatten() }, { status: 400 })
  }

  const { wholesalerId, items, notes } = validated.data
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  const order = await prisma.order.create({
    data: {
      shopId: shop.id,
      wholesalerId,
      totalAmount,
      notes,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true, wholesaler: { include: { user: true } } },
  })

  return NextResponse.json(order, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, status } = body

  // Wholesaler can update order status
  if (session.user.role === 'WHOLESALER') {
    const wholesaler = await prisma.wholesaler.findUnique({ where: { userId: session.user.id } })
    if (!wholesaler) return NextResponse.json({ error: 'Wholesaler not found' }, { status: 404 })

    const order = await prisma.order.findFirst({
      where: { id, wholesalerId: wholesaler.id },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
