import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'
import { analyzeProductImage } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const analyze = formData.get('analyze') === 'true'

  if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = buffer.toString('base64')
  const mimeType = file.type || 'image/jpeg'

  const { url, publicId } = await uploadImage(base64, 'stockgenie/products')

  let productInfo = null
  if (analyze) {
    try {
      const rawAnalysis = await analyzeProductImage(base64, mimeType)
      const cleaned = rawAnalysis.replace(/```json\n?|\n?```/g, '').trim()
      productInfo = JSON.parse(cleaned)
    } catch {
      productInfo = null
    }
  }

  return NextResponse.json({ url, publicId, productInfo })
}
