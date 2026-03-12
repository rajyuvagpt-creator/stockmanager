import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8),
  role: z.enum(['SHOPKEEPER', 'WHOLESALER']),
  businessName: z.string().min(1),
  businessType: z.string().optional(),
  gstNumber: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validated = registerSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.flatten() }, { status: 400 })
  }

  const { password, role, businessName, ...userData } = validated.data

  const existing = await prisma.user.findUnique({ where: { email: userData.email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      ...userData,
      passwordHash,
      role,
      businessName,
    },
  })

  // Create role-specific profile
  if (role === 'SHOPKEEPER') {
    await prisma.shop.create({
      data: {
        userId: user.id,
        shopName: businessName,
        category: validated.data.businessType,
      },
    })
  } else if (role === 'WHOLESALER') {
    await prisma.wholesaler.create({
      data: {
        userId: user.id,
        companyName: businessName,
      },
    })
  }

  return NextResponse.json(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    { status: 201 }
  )
}
