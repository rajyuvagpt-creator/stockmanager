'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Plus, Tag } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Catalog {
  id: string
  name: string
  description?: string
  isActive: boolean
  startDate?: string
  endDate?: string
  createdAt: string
  items?: Array<{
    id: string
    productId: string
    price: number
    salePrice?: number
    isOnSale: boolean
  }>
}

export function CatalogBuilder() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true,
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchCatalogs()
  }, [])

  const fetchCatalogs = async () => {
    try {
      const res = await fetch('/api/catalog')
      const data = await res.json()
      setCatalogs(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  const createCatalog = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ name: '', description: '', isActive: true, startDate: '', endDate: '' })
    fetchCatalogs()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Catalog
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Create Catalog</h3>
          <form onSubmit={createCatalog} className="space-y-3">
            <input
              placeholder="Catalog name (e.g. Diwali Sale 2025)"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Create
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {catalogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="h-8 w-8 mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-900">No catalogs yet</p>
          <p className="text-sm text-gray-500 mt-1">Create a catalog to showcase your products and run sales</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogs.map((catalog) => (
            <div key={catalog.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{catalog.name}</h3>
                  {catalog.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{catalog.description}</p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    catalog.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {catalog.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                {catalog.startDate && <div>Start: {formatDate(catalog.startDate)}</div>}
                {catalog.endDate && <div>End: {formatDate(catalog.endDate)}</div>}
                <div className="flex items-center gap-1 mt-2">
                  <Tag className="h-3 w-3" />
                  <span>{catalog.items?.length || 0} items</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
