'use client'

import { useState, useCallback } from 'react'

interface ForecastOptions {
  forecastType?: 'WEEKLY' | 'MONTHLY' | 'SEASONAL' | 'FESTIVAL' | 'CUSTOM'
  season?: string
  days?: number
}

export function useForecast() {
  const [forecasts, setForecasts] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchForecasts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/forecasts')
      const data = await res.json()
      setForecasts(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to fetch forecasts')
    } finally {
      setLoading(false)
    }
  }, [])

  const generateForecast = useCallback(async (options: ForecastOptions = {}) => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const days = options.days || 30
      const end = new Date(now)
      end.setDate(end.getDate() + days)

      const res = await fetch('/api/forecasts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forecastType: options.forecastType || 'MONTHLY',
          season: options.season,
          startDate: now.toISOString(),
          endDate: end.toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate forecast')

      setForecasts((prev) => [data.forecast, ...prev])
      return data
    } catch (err) {
      setError((err as Error).message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { forecasts, loading, error, fetchForecasts, generateForecast }
}
