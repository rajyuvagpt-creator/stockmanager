import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateInvoiceNumber } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    include: { order: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(invoices)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { orderId, type, totalAmount, taxAmount = 0, discountAmount = 0, dueDate } = body

  const netAmount = totalAmount + taxAmount - discountAmount

  const invoice = await prisma.invoice.create({
    data: {
      userId: session.user.id,
      orderId,
      invoiceNumber: generateInvoiceNumber(),
      type,
      totalAmount,
      taxAmount,
      discountAmount,
      netAmount,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    },
  })

  return NextResponse.json(invoice, { status: 201 })
}
