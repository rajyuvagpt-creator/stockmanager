import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, invoiceId } = body

  const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      razorpayPaymentId,
      status: 'PAID',
    },
  })

  return NextResponse.json({ success: true, invoice })
}
