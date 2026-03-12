import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const forecasts = await prisma.forecast.findMany({
    where: { shopId: shop.id },
    include: {
      forecastItems: {
        include: { product: true },
      },
    },
    orderBy: { generatedAt: 'desc' },
    take: 10,
  })

  return NextResponse.json(forecasts)
}
