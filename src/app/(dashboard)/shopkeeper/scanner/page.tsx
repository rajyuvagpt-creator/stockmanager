import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { BarcodeScanner } from '@/components/BarcodeScanner'

export default async function ScannerPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Barcode Scanner</h1>
        <p className="text-gray-500 text-sm mt-1">
          Scan product barcodes and QR codes
        </p>
      </div>
      <BarcodeScanner />
    </div>
  )
}
