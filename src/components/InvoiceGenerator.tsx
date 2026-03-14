'use client'

import { useEffect, useState } from 'react'
import { FileText, Plus, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Invoice {
  id: string
  invoiceNumber: string
  type: string
  totalAmount: number
  netAmount: number
  status: string
  createdAt: string
  dueDate?: string
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void
  prefill?: { name?: string; email?: string }
  theme?: { color?: string }
}

interface RazorpayInstance {
  open: () => void
}

export function InvoiceGenerator() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/billing')
      const data = await res.json()
      setInvoices(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async (invoice: Invoice) => {
    try {
      const res = await fetch('/api/billing/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, amount: invoice.netAmount }),
      })
      const data = await res.json()

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'StockGenie',
          description: `Invoice ${invoice.invoiceNumber}`,
          order_id: data.orderId,
          handler: async (response) => {
            await fetch('/api/billing/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                invoiceId: invoice.id,
              }),
            })
            fetchInvoices()
          },
          theme: { color: '#3b82f6' },
        })
        rzp.open()
      }
    } catch {
      alert('Payment initialization failed')
    }
  }

  const statusColor: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    UNPAID: 'bg-amber-100 text-amber-700',
    OVERDUE: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-blue-100 text-blue-700',
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Invoices</h3>
        </div>
        <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1">
          <Plus className="h-3 w-3" />
          New Invoice
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No invoices yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between px-4 py-4">
              <div>
                <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                <div className="text-xs text-gray-500">
                  {invoice.type} · {formatDate(invoice.createdAt)}
                  {invoice.dueDate && ` · Due: ${formatDate(invoice.dueDate)}`}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    statusColor[invoice.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {invoice.status}
                </span>
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(invoice.netAmount)}
                </div>
                {invoice.status !== 'PAID' && (
                  <button
                    onClick={() => handlePay(invoice)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                  >
                    <CreditCard className="h-3 w-3" />
                    Pay
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
