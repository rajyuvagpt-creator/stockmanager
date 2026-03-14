'use client'

import { useEffect, useRef, useState } from 'react'
import { Wifi, X, CheckCircle, AlertCircle, WifiOff } from 'lucide-react'

// Minimal Web NFC API type declarations (not yet in TypeScript's DOM lib)
interface NDEFRecord {
  recordType: string
  mediaType?: string
  id?: string
  data?: DataView
  encoding?: string
  lang?: string
}

interface NDEFMessage {
  records: NDEFRecord[]
}

interface NDEFReadingEvent extends Event {
  serialNumber: string
  message: NDEFMessage
}

interface NDEFReader extends EventTarget {
  scan(options?: { signal?: AbortSignal }): Promise<void>
  onreading: ((event: NDEFReadingEvent) => void) | null
  onreadingerror: ((event: Event) => void) | null
}

declare global {
  interface Window {
    NDEFReader?: new () => NDEFReader
  }
}

interface NFCScanResult {
  serialNumber: string
  text: string
}

// NDEF URL record prefix byte → URL scheme (NFC Forum URI Record Type Definition, §3.2.2)
const NDEF_URL_PREFIXES: Record<number, string> = {
  0x01: 'http://www.',
  0x02: 'https://www.',
  0x03: 'http://',
  0x04: 'https://',
  0x05: 'tel:',
  0x06: 'mailto:',
  0x07: 'ftp://anonymous:anonymous@',
  0x08: 'ftp://ftp.',
  0x09: 'ftps://',
  0x0a: 'sftp://',
  0x0b: 'smb://',
  0x0c: 'nfs://',
  0x0d: 'ftp://',
  0x0e: 'dav://',
  0x0f: 'news:',
  0x10: 'telnet://',
  0x11: 'imap:',
  0x12: 'rtsp://',
  0x13: 'urn:',
  0x14: 'pop:',
  0x15: 'sip:',
  0x16: 'sips:',
  0x17: 'tftp:',
  0x18: 'btspp://',
  0x19: 'btl2cap://',
  0x1a: 'btgoep://',
  0x1b: 'tcpobex://',
  0x1c: 'irdaobex://',
  0x1d: 'file://',
  0x1e: 'urn:epc:id:',
  0x1f: 'urn:epc:tag:',
  0x20: 'urn:epc:pat:',
  0x21: 'urn:epc:raw:',
  0x22: 'urn:epc:',
  0x23: 'urn:nfc:',
}

function decodeNDEFText(record: NDEFRecord): string {
  if (!record.data) return ''
  try {
    const encoding = record.encoding ?? 'utf-8'
    // First byte is the status byte: bits 5-0 hold the language code length
    const langLength = record.data.getUint8(0) & 0x3f
    const textBytes = new Uint8Array(
      record.data.buffer,
      record.data.byteOffset + 1 + langLength,
    )
    return new TextDecoder(encoding).decode(textBytes)
  } catch {
    return ''
  }
}

function decodeNDEFUrl(record: NDEFRecord): string {
  if (!record.data) return ''
  try {
    // First byte is the URI identifier code (prefix)
    const prefixByte = record.data.getUint8(0)
    const prefix = NDEF_URL_PREFIXES[prefixByte] ?? ''
    const rest = new TextDecoder().decode(
      new Uint8Array(record.data.buffer, record.data.byteOffset + 1),
    )
    return prefix + rest
  } catch {
    return ''
  }
}

export function NFCScanner() {
  const abortRef = useRef<AbortController | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<NFCScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<{ name: string; category: string } | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'NDEFReader' in window)
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const startScanner = async () => {
    if (!window.NDEFReader) return
    setError(null)
    setResult(null)
    setProduct(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const reader = new window.NDEFReader()

      reader.onreading = (event: NDEFReadingEvent) => {
        const serial = event.serialNumber
        let text = ''

        for (const record of event.message.records) {
          if (record.recordType === 'text') {
            text = decodeNDEFText(record)
            break
          }
          if (record.recordType === 'url') {
            text = decodeNDEFUrl(record)
            break
          }
        }

        // Fall back to serial number when no text/url record is present.
        // NFC inventory tags typically store the product barcode as their text
        // payload, so we pass it as the 'barcode' query param to the scan API.
        const code = text || serial
        setResult({ serialNumber: serial, text: code })
        stopScanner()
        lookupProduct(code)
      }

      reader.onreadingerror = () => {
        setError('Could not read NFC tag. Please try again.')
      }

      await reader.scan({ signal: controller.signal })
      setScanning(true)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('NFC permission denied. Please allow NFC access in your browser settings.')
      } else {
        setError('NFC is unavailable. Make sure NFC is enabled on your device.')
      }
    }
  }

  const stopScanner = () => {
    abortRef.current?.abort()
    abortRef.current = null
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
      // Lookup failed — just show the tag data
    }
  }

  if (supported === false) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <div className="flex items-center gap-3 text-gray-400">
          <WifiOff className="h-8 w-8 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-700">NFC not supported</p>
            <p className="text-sm">
              Web NFC requires Chrome 89+ on Android with NFC enabled.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
      <div className="text-center space-y-4">
        {/* NFC icon / animation */}
        <div className="relative aspect-square w-full max-w-sm mx-auto bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
          <Wifi
            className={`h-24 w-24 ${scanning ? 'text-blue-400 animate-ping' : 'text-gray-600'}`}
          />
          {scanning && (
            <div className="absolute inset-0 border-4 border-blue-400 animate-pulse rounded-xl pointer-events-none" />
          )}
        </div>

        {/* Controls */}
        {!scanning ? (
          <button
            onClick={startScanner}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Wifi className="h-5 w-5" />
            Start NFC Scan
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <X className="h-5 w-5" />
            Stop NFC Scan
          </button>
        )}

        {scanning && (
          <p className="text-sm text-gray-500 animate-pulse">
            Hold an NFC tag near the back of your device...
          </p>
        )}

        {/* Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <CheckCircle className="h-5 w-5" />
              NFC Tag Read
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-gray-500">Serial: </span>
                <span className="font-mono font-medium">{result.serialNumber}</span>
              </div>
              {result.text && result.text !== result.serialNumber && (
                <div>
                  <span className="text-gray-500">Data: </span>
                  <span className="font-mono font-medium">{result.text}</span>
                </div>
              )}
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
          Requires Chrome 89+ on Android · NFC must be enabled
        </p>
      </div>
    </div>
  )
}
