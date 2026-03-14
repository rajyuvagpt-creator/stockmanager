'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart3, Loader2 } from 'lucide-react'

interface ForecastItem {
  product: { name: string }
  predictedDemand: number
  suggestedOrder: number
  currentStock: number
}

interface Forecast {
  id: string
  forecastType: string
  season: string
  confidence: number
  generatedAt: string
  forecastItems: ForecastItem[]
}

export function ForecastChart() {
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [selected, setSelected] = useState<Forecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchForecasts()
  }, [])

  const fetchForecasts = async () => {
    try {
      const res = await fetch('/api/forecasts')
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setForecasts(list)
      if (list.length > 0) setSelected(list[0])
    } finally {
      setLoading(false)
    }
  }

  const generateForecast = async () => {
    setGenerating(true)
    try {
      const now = new Date()
      const end = new Date(now)
      end.setDate(end.getDate() + 30)

      const res = await fetch('/api/forecasts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forecastType: 'MONTHLY',
          startDate: now.toISOString(),
          endDate: end.toISOString(),
        }),
      })
      const data = await res.json()
      if (data.forecast) {
        setForecasts((prev) => [data.forecast, ...prev])
        setSelected(data.forecast)
      }
    } finally {
      setGenerating(false)
    }
  }

  const chartData =
    selected?.forecastItems.slice(0, 10).map((item) => ({
      name: item.product.name.substring(0, 12),
      'Current Stock': item.currentStock,
      'Predicted Demand': item.predictedDemand,
      'Suggested Order': item.suggestedOrder,
    })) || []

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {forecasts.slice(0, 5).map((f) => (
            <button
              key={f.id}
              onClick={() => setSelected(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selected?.id === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.forecastType} ({new Date(f.generatedAt).toLocaleDateString('en-IN')})
            </button>
          ))}
        </div>
        <button
          onClick={generateForecast}
          disabled={generating}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BarChart3 className="h-4 w-4" />
          )}
          {generating ? 'Generating...' : 'Generate New'}
        </button>
      </div>

      {selected ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                {selected.forecastType} Forecast — {selected.season}
              </h3>
              <p className="text-sm text-gray-500">
                Confidence: {(selected.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Current Stock" fill="#93c5fd" />
              <Bar dataKey="Predicted Demand" fill="#3b82f6" />
              <Bar dataKey="Suggested Order" fill="#1d4ed8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No forecasts yet</h3>
          <p className="text-gray-500 text-sm">
            Generate your first AI forecast to see demand predictions
          </p>
        </div>
      )}
    </div>
  )
}
