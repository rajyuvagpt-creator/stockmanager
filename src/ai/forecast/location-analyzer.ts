export interface LocationDemandFactor {
  region: string
  states: string[]
  productBoost: Record<string, number>
}

const LOCATION_DEMAND_FACTORS: LocationDemandFactor[] = [
  {
    region: 'North India',
    states: ['Delhi', 'Punjab', 'Haryana', 'UP', 'Uttarakhand', 'HP', 'J&K'],
    productBoost: {
      wheat: 1.5,
      dairy: 1.3,
      spices: 1.4,
      woollens: 1.6,
    },
  },
  {
    region: 'South India',
    states: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'],
    productBoost: {
      rice: 1.6,
      coconut: 1.8,
      spices: 1.5,
      seafood: 1.7,
    },
  },
  {
    region: 'West India',
    states: ['Maharashtra', 'Gujarat', 'Rajasthan', 'Goa'],
    productBoost: {
      pulses: 1.4,
      snacks: 1.5,
      dairy: 1.3,
      beverages: 1.4,
    },
  },
  {
    region: 'East India',
    states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'],
    productBoost: {
      rice: 1.5,
      fish: 1.8,
      sweets: 1.6,
    },
  },
]

export function getLocationMultiplier(
  state: string,
  productCategory: string
): { multiplier: number; region: string } {
  const factor = LOCATION_DEMAND_FACTORS.find((f) =>
    f.states.some((s) => s.toLowerCase().includes(state.toLowerCase()))
  )

  if (!factor) return { multiplier: 1.0, region: 'Unknown' }

  const categoryKey = productCategory.toLowerCase()
  const boost = Object.entries(factor.productBoost).find(([key]) =>
    categoryKey.includes(key)
  )

  return {
    multiplier: boost ? boost[1] : 1.0,
    region: factor.region,
  }
}

export function getRegionFromCity(city: string): string {
  const cityToState: Record<string, string> = {
    mumbai: 'Maharashtra',
    delhi: 'Delhi',
    bangalore: 'Karnataka',
    bengaluru: 'Karnataka',
    chennai: 'Tamil Nadu',
    kolkata: 'West Bengal',
    hyderabad: 'Telangana',
    pune: 'Maharashtra',
    ahmedabad: 'Gujarat',
    jaipur: 'Rajasthan',
    lucknow: 'UP',
    kanpur: 'UP',
    nagpur: 'Maharashtra',
    patna: 'Bihar',
    bhopal: 'MP',
    ludhiana: 'Punjab',
    agra: 'UP',
    surat: 'Gujarat',
    vadodara: 'Gujarat',
  }

  return cityToState[city.toLowerCase()] || 'Unknown'
}
