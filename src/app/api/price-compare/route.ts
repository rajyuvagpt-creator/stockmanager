import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateForecast } from '@/lib/gemini'
import { buildPriceAnalysisPrompt } from '@/ai/prompts/price-analysis'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')

  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

  const comparisons = await prisma.priceComparison.findMany({
    where: { productId },
    orderBy: { price: 'asc' },
  })

  return NextResponse.json(comparisons)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { productId, analyze } = body

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const comparisons = await prisma.priceComparison.findMany({ where: { productId } })

  if (analyze && comparisons.length > 0) {
    // Get current purchase price from shopkeeper's inventory
    let currentPurchasePrice = 0
    if (session.user.role === 'SHOPKEEPER') {
      const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } })
      if (shop) {
        const inv = await prisma.inventory.findFirst({
          where: { shopId: shop.id, productId },
        })
        currentPurchasePrice = inv?.purchasePrice || 0
      }
    }

    const prompt = buildPriceAnalysisPrompt({
      productName: product.name,
      category: product.category,
      currentPurchasePrice,
      priceComparisons: comparisons.map((c) => ({
        wholesalerName: c.wholesalerName,
        price: c.price,
        bulkPrice: c.bulkPrice || undefined,
      })),
      monthlyVolume: 100,
    })

    const rawAnalysis = await generateForecast(prompt)
    const cleaned = rawAnalysis.replace(/```json\n?|\n?```/g, '').trim()
    const analysis = JSON.parse(cleaned)

    return NextResponse.json({ comparisons, analysis })
  }

  return NextResponse.json({ comparisons })
}
