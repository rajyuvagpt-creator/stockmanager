'use client'

import { useEffect, useState } from 'react'
import { Package, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'

interface InventoryItem {
  id: string
  quantity: number
  reorderLevel: number
  sellingPrice: number
  product: {
    name: string
    category: string
    unit: string
  }
}

interface StockOverviewProps {
  shopId: string
}

export function StockOverview({ shopId }: StockOverviewProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory')
      const data = await res.json()
      setInventory(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  const filtered = inventory.filter((i) =>
    i.product.name.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: inventory.length,
    lowStock: inventory.filter((i) => i.quantity <= i.reorderLevel).length,
    outOfStock: inventory.filter((i) => i.quantity === 0).length,
    totalValue: inventory.reduce((sum, i) => sum + i.quantity * i.sellingPrice, 0),
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Package className="h-4 w-4" />
            Total Items
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-amber-500 text-sm mb-1">
            <AlertTriangle className="h-4 w-4" />
            Low Stock
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.lowStock}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-red-500 text-sm mb-1">
            <TrendingDown className="h-4 w-4" />
            Out of Stock
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-500 text-sm mb-1">
            <TrendingUp className="h-4 w-4" />
            Stock Value
          </div>
          <div className="text-xl font-bold text-green-600">
            ₹{stats.totalValue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-3 text-gray-300" />
            <p>{search ? 'No products found' : 'No inventory yet. Add products to get started.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-left">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Quantity</th>
                  <th className="px-4 py-3 font-medium text-right">Reorder At</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const isLow = item.quantity <= item.reorderLevel
                  const isOut = item.quantity === 0
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.product.name}</td>
                      <td className="px-4 py-3 text-gray-500">{item.product.category}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {item.quantity} {item.product.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.reorderLevel}</td>
                      <td className="px-4 py-3 text-right">₹{item.sellingPrice}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            isOut
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
