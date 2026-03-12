import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const inventorySchema = z.object({
  productId: z.string(),
  quantity: z.number().min(0),
  reorderLevel: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  purchasePrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  mrp: z.number().min(0).optional(),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  location: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const lowStock = searchParams.get('lowStock') === 'true'
  const search = searchParams.get('search')

  const inventory = await prisma.inventory.findMany({
    where: {
      shopId: shop.id,
      ...(category ? { product: { category } } : {}),
      ...(search ? { product: { name: { contains: search, mode: 'insensitive' } } } : {}),
    },
    include: { product: true },
    orderBy: { product: { name: 'asc' } },
  })

  const result = lowStock
    ? inventory.filter((i) => i.quantity <= i.reorderLevel)
    : inventory

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const validated = inventorySchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.flatten() }, { status: 400 })
  }

  const { productId, expiryDate, ...rest } = validated.data

  const inventory = await prisma.inventory.create({
    data: {
      shopId: shop.id,
      productId,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      ...rest,
    },
    include: { product: true },
  })

  return NextResponse.json(inventory, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const { id, ...rest } = body

  const inventory = await prisma.inventory.findFirst({
    where: { id, shopId: shop.id },
  })
  if (!inventory) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const updated = await prisma.inventory.update({
    where: { id },
    data: rest,
    include: { product: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const inventory = await prisma.inventory.findFirst({
    where: { id, shopId: shop.id },
  })
  if (!inventory) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  await prisma.inventory.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
