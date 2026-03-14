'use client'

import { useState, useEffect } from 'react'
import { TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react'

interface ComparisonResult {
  wholesalerName: string
  price: number
  bulkPrice?: number
  lastChecked: string
}

export default function PriceComparePage() {
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([])
  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState('')

  const fetchComparisons = async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/price-compare?productId=${productId}`)
      const data = await res.json()
      setComparisons(data.comparisons || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Price Comparison</h1>
        <p className="text-gray-500 text-sm mt-1">Compare wholesale prices and save money</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex gap-3 mb-6">
          <input
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Enter product ID to compare prices"
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchComparisons}
            disabled={loading || !productId}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TrendingDown className="h-4 w-4" />}
            Compare
          </button>
        </div>

        {comparisons.length > 0 ? (
          <div className="space-y-3">
            {comparisons.map((c, i) => (
              <div key={i} className={`p-4 rounded-lg border ${i === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{c.wholesalerName}</div>
                    {i === 0 && <div className="text-xs text-green-600 font-medium">Best Price</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">₹{c.price}</div>
                    {c.bulkPrice && (
                      <div className="text-xs text-gray-500">Bulk: ₹{c.bulkPrice}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-gray-300" />
            <p>Enter a product ID to compare prices</p>
          </div>
        )}
      </div>
    </div>
  )
}
