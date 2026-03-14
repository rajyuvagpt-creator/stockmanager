import { prisma } from '@/lib/prisma'

interface CreateOrderData {
  shopId: string
  wholesalerId: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
  }>
  notes?: string
}

export async function createOrder(data: CreateOrderData) {
  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  const order = await prisma.order.create({
    data: {
      shopId: data.shopId,
      wholesalerId: data.wholesalerId,
      totalAmount,
      notes: data.notes,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      items: true,
      wholesaler: { include: { user: true } },
    },
  })

  return order
}

export async function getOrderStatus(orderId: string, shopId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, shopId },
    include: {
      items: true,
      wholesaler: { include: { user: true } },
    },
  })
  return order
}
