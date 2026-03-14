export function buildForecastPrompt(params: {
  shopName: string
  location: string
  season: string
  forecastType: string
  currentInventory: Array<{
    productName: string
    category: string
    currentStock: number
    avgDailySales: number
    reorderLevel: number
  }>
  historicalData?: string
}): string {
  return `You are an AI demand forecasting expert for Indian retail shops.

## Shop Information:
- Shop: ${params.shopName}
- Location: ${params.location}
- Season/Period: ${params.season}
- Forecast Type: ${params.forecastType}

## Current Inventory:
${params.currentInventory.map((item) => `- ${item.productName} (${item.category}): Current stock: ${item.currentStock} units, Avg daily sales: ${item.avgDailySales} units, Reorder level: ${item.reorderLevel}`).join('\n')}

${params.historicalData ? `## Historical Sales Data:\n${params.historicalData}` : ''}

## Task:
Generate a demand forecast considering:
1. **Seasonal factors**: Indian festivals, harvest seasons, weather patterns
2. **Location-based demand**: Regional preferences, local festivals
3. **Category trends**: Perishables need shorter forecast windows
4. **Economic factors**: Price sensitivity of Indian consumers

## Response Format (JSON):
{
  "forecastSummary": "Brief overview of demand drivers",
  "confidence": 0.85,
  "items": [
    {
      "productName": "Product Name",
      "currentStock": 50,
      "predictedDemand": 150,
      "suggestedOrder": 100,
      "reasoning": "Diwali season increases demand by 3x",
      "priority": "high" | "medium" | "low"
    }
  ],
  "seasonalInsights": "Key seasonal insights",
  "actionItems": ["Action 1", "Action 2"]
}

Respond ONLY with valid JSON.`
}
