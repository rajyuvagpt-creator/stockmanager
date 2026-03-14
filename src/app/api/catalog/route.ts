import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const catalogSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        price: z.number().min(0),
        salePrice: z.number().min(0).optional(),
        isOnSale: z.boolean().default(false),
      })
    )
    .optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.user.role === 'SHOPKEEPER') {
    const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const catalogs = await prisma.catalog.findMany({
      where: { shopId: shop.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(catalogs)
  }

  if (session.user.role === 'WHOLESALER') {
    const wholesaler = await prisma.wholesaler.findUnique({ where: { userId: session.user.id } })
    if (!wholesaler) return NextResponse.json({ error: 'Wholesaler not found' }, { status: 404 })

    const catalogs = await prisma.wholesalerCatalog.findMany({
      where: { wholesalerId: wholesaler.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(catalogs)
  }

  return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (session.user.role === 'SHOPKEEPER') {
    const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const validated = catalogSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten() }, { status: 400 })
    }

    const { items, startDate, endDate, ...catalogData } = validated.data

    const catalog = await prisma.catalog.create({
      data: {
        shopId: shop.id,
        ...catalogData,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        items: items
          ? {
              create: items,
            }
          : undefined,
      },
      include: { items: true },
    })
    return NextResponse.json(catalog, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
}
