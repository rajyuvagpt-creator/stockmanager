import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  barcode: z.string().optional(),
  qrCode: z.string().optional(),
  category: z.string(),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().default('piece'),
  imageUrl: z.string().optional(),
  isPerishable: z.boolean().default(false),
  shelfLife: z.number().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const category = searchParams.get('category')

  const products = await prisma.product.findMany({
    where: {
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { name: 'asc' },
    take: 50,
  })

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const validated = productSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.flatten() }, { status: 400 })
  }

  // Check for duplicate barcode
  if (validated.data.barcode) {
    const existing = await prisma.product.findUnique({
      where: { barcode: validated.data.barcode },
    })
    if (existing) {
      return NextResponse.json({ error: 'Barcode already exists', product: existing }, { status: 409 })
    }
  }

  const product = await prisma.product.create({ data: validated.data })
  return NextResponse.json(product, { status: 201 })
}
