import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createRazorpayOrder } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { invoiceId, amount } = body

  if (!invoiceId || !amount) {
    return NextResponse.json({ error: 'invoiceId and amount required' }, { status: 400 })
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
  })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const order = await createRazorpayOrder(amount, 'INR', `inv_${invoiceId}`)

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { razorpayOrderId: order.id as string },
  })

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  })
}
