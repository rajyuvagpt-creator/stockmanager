import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { InvoiceGenerator } from '@/components/InvoiceGenerator'

export default async function WholesalerBillingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
        <p className="text-gray-500 text-sm mt-1">Manage invoices and payments</p>
      </div>
      <InvoiceGenerator />
    </div>
  )
}
