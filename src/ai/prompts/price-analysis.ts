export function buildPriceAnalysisPrompt(params: {
  productName: string
  category: string
  currentPurchasePrice: number
  priceComparisons: Array<{
    wholesalerName: string
    price: number
    bulkPrice?: number
    bulkMinQty?: number
  }>
  monthlyVolume: number
}): string {
  return `Analyze wholesale prices for an Indian shopkeeper and provide buying recommendations.

## Product: ${params.productName} (${params.category})
## Current Purchase Price: ₹${params.currentPurchasePrice}
## Monthly Purchase Volume: ${params.monthlyVolume} units

## Price Comparisons:
${params.priceComparisons.map((p) => `- ${p.wholesalerName}: ₹${p.price}/unit${p.bulkPrice ? `, Bulk price: ₹${p.bulkPrice} (min ${p.bulkMinQty} units)` : ''}`).join('\n')}

## Provide:
1. Best value wholesaler recommendation
2. Potential monthly savings
3. Bulk buying analysis (is it worth it?)
4. Risk factors to consider

## Response Format (JSON):
{
  "recommendation": "wholesaler name",
  "reason": "explanation",
  "monthlySavings": 0,
  "bulkBuyingAdvice": "advice",
  "riskFactors": ["factor1"],
  "summary": "One line summary in Hindi/English"
}

Respond ONLY with valid JSON.`
}
