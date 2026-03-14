'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Package } from 'lucide-react'

interface LowStockItem {
  id: string
  quantity: number
  reorderLevel: number
  product: {
    name: string
    unit: string
    category: string
  }
}

interface LowStockAlertsProps {
  shopId: string
}

export function LowStockAlerts({ shopId }: LowStockAlertsProps) {
  const [items, setItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/inventory?lowStock=true')
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="font-semibold text-gray-900">Low Stock Alerts</h3>
        {items.length > 0 && (
          <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">All stock levels are healthy! ✅</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const percentage = item.reorderLevel > 0 ? (item.quantity / item.reorderLevel) * 100 : 0
            const isOut = item.quantity === 0
            return (
              <div key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                    <div className="text-xs text-gray-500">{item.product.category}</div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isOut ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isOut ? 'Out' : 'Low'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    {item.quantity} / {item.reorderLevel} {item.product.unit}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOut ? 'bg-red-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
