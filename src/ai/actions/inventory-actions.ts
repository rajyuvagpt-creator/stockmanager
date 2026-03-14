import { prisma } from '@/lib/prisma'

interface UpdateStockData {
  productName: string
  quantity: number
  operation: 'add' | 'set' | 'subtract'
  shopId: string
}

export async function updateInventoryStock(data: UpdateStockData) {
  const product = await prisma.product.findFirst({
    where: {
      name: { contains: data.productName, mode: 'insensitive' },
    },
  })

  if (!product) {
    throw new Error(`Product "${data.productName}" not found`)
  }

  const inventory = await prisma.inventory.findFirst({
    where: { shopId: data.shopId, productId: product.id },
  })

  if (!inventory) {
    throw new Error(`Product "${data.productName}" not in shop inventory`)
  }

  let newQuantity: number
  switch (data.operation) {
    case 'add':
      newQuantity = inventory.quantity + data.quantity
      break
    case 'subtract':
      newQuantity = Math.max(0, inventory.quantity - data.quantity)
      break
    case 'set':
      newQuantity = data.quantity
      break
    default:
      newQuantity = inventory.quantity
  }

  const updated = await prisma.inventory.update({
    where: { id: inventory.id },
    data: {
      quantity: newQuantity,
      lastRestocked: data.operation === 'add' ? new Date() : undefined,
    },
    include: { product: true },
  })

  return updated
}

export async function checkLowStock(shopId: string) {
  const items = await prisma.$queryRaw<
    Array<{
      id: string
      productName: string
      quantity: number
      reorderLevel: number
      unit: string
    }>
  >`
    SELECT i.id, p.name as "productName", i.quantity, i."reorderLevel", p.unit
    FROM "Inventory" i
    JOIN "Product" p ON i."productId" = p.id
    WHERE i."shopId" = ${shopId} AND i.quantity <= i."reorderLevel"
    ORDER BY i.quantity ASC
  `
  return items
}
