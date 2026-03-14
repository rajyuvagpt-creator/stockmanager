'use client'

import { useState, useEffect, useCallback } from 'react'

interface ScannerState {
  scanning: boolean
  result: string | null
  error: string | null
}

export function useScanner() {
  const [state, setState] = useState<ScannerState>({
    scanning: false,
    result: null,
    error: null,
  })

  const startScan = useCallback(async () => {
    setState({ scanning: true, result: null, error: null })
  }, [])

  const stopScan = useCallback(() => {
    setState((prev) => ({ ...prev, scanning: false }))
  }, [])

  const setResult = useCallback((result: string) => {
    setState({ scanning: false, result, error: null })
  }, [])

  const setError = useCallback((error: string) => {
    setState({ scanning: false, result: null, error })
  }, [])

  const reset = useCallback(() => {
    setState({ scanning: false, result: null, error: null })
  }, [])

  return { ...state, startScan, stopScan, setResult, setError, reset }
}
