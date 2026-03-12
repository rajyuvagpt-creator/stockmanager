export interface SeasonalFactor {
  name: string
  months: number[]
  multiplier: number
  category?: string[]
}

const INDIAN_SEASONAL_FACTORS: SeasonalFactor[] = [
  {
    name: 'Diwali Season',
    months: [10, 11],
    multiplier: 2.5,
    category: ['sweets', 'snacks', 'gifts', 'dry-fruits', 'beverages'],
  },
  {
    name: 'Holi',
    months: [3],
    multiplier: 1.8,
    category: ['colours', 'sweets', 'beverages', 'snacks'],
  },
  {
    name: 'Eid',
    months: [3, 4],
    multiplier: 2.0,
    category: ['spices', 'meat', 'sweets', 'dry-fruits'],
  },
  {
    name: 'Monsoon',
    months: [6, 7, 8, 9],
    multiplier: 1.3,
    category: ['umbrella', 'rainwear', 'hot-beverages', 'medicines'],
  },
  {
    name: 'Summer',
    months: [4, 5, 6],
    multiplier: 1.5,
    category: ['cold-beverages', 'ice-cream', 'cooling-products'],
  },
  {
    name: 'Winter',
    months: [11, 12, 1, 2],
    multiplier: 1.4,
    category: ['woollens', 'hot-beverages', 'spices'],
  },
  {
    name: 'Harvest Season (Rabi)',
    months: [3, 4],
    multiplier: 1.6,
    category: ['grains', 'cereals', 'agricultural'],
  },
  {
    name: 'Harvest Season (Kharif)',
    months: [10, 11],
    multiplier: 1.4,
    category: ['pulses', 'rice', 'spices'],
  },
  {
    name: 'New Year',
    months: [1],
    multiplier: 1.3,
    category: ['all'],
  },
  {
    name: 'Independence Day',
    months: [8],
    multiplier: 1.2,
    category: ['all'],
  },
]

export function getSeasonalMultiplier(
  month: number,
  productCategory: string
): { multiplier: number; factors: string[] } {
  const applicableFactors = INDIAN_SEASONAL_FACTORS.filter(
    (f) =>
      f.months.includes(month) &&
      (f.category?.includes('all') ||
        f.category?.some((c) => productCategory.toLowerCase().includes(c)))
  )

  if (!applicableFactors.length) return { multiplier: 1.0, factors: [] }

  const maxMultiplier = Math.max(...applicableFactors.map((f) => f.multiplier))
  const factors = applicableFactors.map((f) => f.name)

  return { multiplier: maxMultiplier, factors }
}

export function getCurrentSeason(date = new Date()): string {
  const month = date.getMonth() + 1
  if ([12, 1, 2].includes(month)) return 'Winter'
  if ([3, 4, 5].includes(month)) return 'Spring/Summer'
  if ([6, 7, 8, 9].includes(month)) return 'Monsoon'
  return 'Autumn/Festival'
}

export function getUpcomingFestivals(daysAhead = 30): SeasonalFactor[] {
  const now = new Date()
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  const currentMonth = now.getMonth() + 1
  const futureMonth = futureDate.getMonth() + 1

  return INDIAN_SEASONAL_FACTORS.filter((f) =>
    f.months.some((m) => m === currentMonth || m === futureMonth)
  )
}
