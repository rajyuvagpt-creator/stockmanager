import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const barcode = searchParams.get('barcode')
  const qrCode = searchParams.get('qrCode')

  if (!barcode && !qrCode) {
    return NextResponse.json({ error: 'barcode or qrCode required' }, { status: 400 })
  }

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        barcode ? { barcode } : {},
        qrCode ? { qrCode } : {},
      ],
    },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found', code: barcode || qrCode }, { status: 404 })
  }

  // Check if in shop inventory
  if (session.user.role === 'SHOPKEEPER') {
    const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
    if (shop) {
      const inventory = await prisma.inventory.findFirst({
        where: { shopId: shop.id, productId: product.id },
      })
      return NextResponse.json({ product, inventory })
    }
  }

  return NextResponse.json({ product })
}
