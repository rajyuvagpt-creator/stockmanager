'use client'

import { useEffect, useRef, useState } from 'react'
import { ScanLine, X, CheckCircle, AlertCircle, Camera } from 'lucide-react'

interface ScanResult {
  text: string
  format: string
}

export function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<{ name: string; category: string } | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startScanner = async () => {
    setError(null)
    setResult(null)
    setProduct(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setScanning(true)

      // Dynamically import @zxing/library to avoid SSR issues
      const { BrowserMultiFormatReader } = await import('@zxing/library')
      const codeReader = new BrowserMultiFormatReader()

      if (videoRef.current) {
        codeReader.decodeFromVideoDevice(null, videoRef.current, (scanResult) => {
          if (scanResult) {
            const text = scanResult.getText()
            const format = scanResult.getBarcodeFormat().toString()
            setResult({ text, format })
            stopScanner()
            lookupProduct(text)
          }
        })
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access to scan barcodes.')
    }
  }

  const stopScanner = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  const lookupProduct = async (code: string) => {
    try {
      const res = await fetch(`/api/inventory/scan?barcode=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (data.product) {
        setProduct(data.product)
      }
    } catch {
      // Lookup failed, just show the code
    }
  }

  useEffect(() => {
    return () => stopScanner()
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
      <div className="text-center space-y-4">
        {/* Camera Preview */}
        <div className="relative aspect-square w-full max-w-sm mx-auto bg-black rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
            muted
            playsInline
          />
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="h-16 w-16 text-gray-600" />
            </div>
          )}
          {scanning && (
            <div className="absolute inset-0 border-4 border-blue-400 animate-pulse rounded-xl pointer-events-none" />
          )}
        </div>

        {/* Controls */}
        {!scanning ? (
          <button
            onClick={startScanner}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <ScanLine className="h-5 w-5" />
            Start Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <X className="h-5 w-5" />
            Stop Scanner
          </button>
        )}

        {scanning && (
          <p className="text-sm text-gray-500 animate-pulse">
            Point camera at barcode or QR code...
          </p>
        )}

        {/* Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <CheckCircle className="h-5 w-5" />
              Scanned Successfully
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-gray-500">Code: </span>
                <span className="font-mono font-medium">{result.text}</span>
              </div>
              <div>
                <span className="text-gray-500">Format: </span>
                <span>{result.format}</span>
              </div>
              {product && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-gray-500 text-xs">{product.category}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
              <AlertCircle className="h-5 w-5" />
              Error
            </div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Supports: EAN-13, EAN-8, QR Code, UPC-A, CODE-128, CODE-39
        </p>
      </div>
    </div>
  )
}
