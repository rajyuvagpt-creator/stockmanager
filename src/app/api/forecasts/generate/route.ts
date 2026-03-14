import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateForecast } from '@/lib/gemini'
import { buildForecastPrompt } from '@/ai/prompts/forecast-prompt'
import { getCurrentSeason } from '@/ai/forecast/seasonal-analyzer'

const generateSchema = z.object({
  forecastType: z.enum(['WEEKLY', 'MONTHLY', 'SEASONAL', 'FESTIVAL', 'CUSTOM']),
  season: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'SHOPKEEPER') {
    return NextResponse.json({ error: 'Only shopkeepers can generate forecasts' }, { status: 403 })
  }

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const validated = generateSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.flatten() }, { status: 400 })
  }

  const { forecastType, startDate, endDate } = validated.data
  const season = validated.data.season || getCurrentSeason()

  // Get current inventory
  const inventory = await prisma.inventory.findMany({
    where: { shopId: shop.id },
    include: { product: true },
    take: 20,
  })

  // Get recent sales for avg calculation
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const salesData = await prisma.saleRecord.groupBy({
    by: ['productId'],
    where: {
      shopId: shop.id,
      soldAt: { gte: thirtyDaysAgo },
    },
    _sum: { quantity: true },
  })

  const inventoryWithSales = inventory.map((i) => {
    const sales = salesData.find((s) => s.productId === i.productId)
    const avgDailySales = sales ? (sales._sum.quantity || 0) / 30 : 0
    return {
      productName: i.product.name,
      category: i.product.category,
      currentStock: i.quantity,
      avgDailySales,
      reorderLevel: i.reorderLevel,
    }
  })

  const prompt = buildForecastPrompt({
    shopName: shop.shopName,
    location: `${shop.user.city || ''}, ${shop.user.state || 'India'}`,
    season,
    forecastType,
    currentInventory: inventoryWithSales,
  })

  const rawResponse = await generateForecast(prompt)
  const cleaned = rawResponse.replace(/```json\n?|\n?```/g, '').trim()
  const forecastData = JSON.parse(cleaned)

  // Save forecast to DB
  const forecast = await prisma.forecast.create({
    data: {
      shopId: shop.id,
      forecastType,
      season,
      location: `${shop.user.city || ''}, ${shop.user.state || 'India'}`,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      confidence: forecastData.confidence || 0.7,
      forecastItems: {
        create: await Promise.all(
          (forecastData.items || []).map(async (item: {
            productName: string
            predictedDemand: number
            suggestedOrder: number
            currentStock: number
            reasoning?: string
          }) => {
            const product = await prisma.product.findFirst({
              where: { name: { contains: item.productName, mode: 'insensitive' } },
            })
            return {
              productId: product?.id || inventory[0]?.productId,
              predictedDemand: item.predictedDemand,
              suggestedOrder: item.suggestedOrder,
              currentStock: item.currentStock,
              reasoning: item.reasoning,
            }
          })
        ),
      },
    },
    include: { forecastItems: { include: { product: true } } },
  })

  return NextResponse.json({
    forecast,
    summary: forecastData.forecastSummary,
    insights: forecastData.seasonalInsights,
    actionItems: forecastData.actionItems,
  })
}
