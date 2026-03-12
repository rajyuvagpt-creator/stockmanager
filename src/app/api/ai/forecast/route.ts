import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateForecast } from '@/lib/gemini'
import { buildForecastPrompt } from '@/ai/prompts/forecast-prompt'
import { getCurrentSeason } from '@/ai/forecast/seasonal-analyzer'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    shopName = 'My Shop',
    location = 'India',
    forecastType = 'MONTHLY',
    currentInventory = [],
  } = body

  const season = body.season || getCurrentSeason()

  const prompt = buildForecastPrompt({
    shopName,
    location,
    season,
    forecastType,
    currentInventory,
  })

  const rawResponse = await generateForecast(prompt)
  const cleaned = rawResponse.replace(/```json\n?|\n?```/g, '').trim()

  try {
    const forecast = JSON.parse(cleaned)
    return NextResponse.json(forecast)
  } catch {
    return NextResponse.json({ raw: rawResponse })
  }
}
