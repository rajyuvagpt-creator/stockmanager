import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { NFCScanner } from '@/components/NFCScanner'

export default async function ScannerPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scanner</h1>
        <p className="text-gray-500 text-sm mt-1">
          Scan product barcodes, QR codes, or NFC tags
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">Barcode / QR Code</h2>
          <BarcodeScanner />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">NFC Tag</h2>
          <NFCScanner />
        </div>
      </div>
    </div>
  )
}
