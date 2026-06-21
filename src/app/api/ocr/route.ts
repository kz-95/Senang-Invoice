import { NextRequest, NextResponse } from 'next/server'
import { ocrViaGemini } from '@/services/ocr/ocrVision'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { image: string }
    if (!body.image) {
      return NextResponse.json({ error: 'missing image field' }, { status: 400 })
    }
    const result = await ocrViaGemini(body.image)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'OCR failed'
    console.error('[/api/ocr]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
