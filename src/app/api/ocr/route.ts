import { NextRequest, NextResponse } from 'next/server'

const OCR_URL = process.env.OCR_SERVER_URL || 'http://localhost:8502/ocr'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { image: string }
    if (!body.image) {
      return NextResponse.json({ error: 'missing image field' }, { status: 400 })
    }

    const res = await fetch(OCR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: body.image }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `OCR server: ${err.slice(0, 200)}` }, { status: 502 })
    }

    const data = await res.json() as { text: string; lines: string[]; count: number }
    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'OCR failed'
    console.error('[/api/ocr]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
