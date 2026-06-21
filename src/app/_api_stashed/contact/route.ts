import { NextRequest, NextResponse } from 'next/server'

interface ContactBody {
  name?: string
  email?: string
  message?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactBody
    const name = body.name?.trim() ?? ''
    const email = body.email?.trim() ?? ''
    const message = body.message?.trim() ?? ''

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const endpoint = process.env.SENANG_FORMSPREE_ENDPOINT
    if (!endpoint) {
      console.error('[/api/contact] SENANG_FORMSPREE_ENDPOINT not configured')
      return NextResponse.json({ error: 'Contact form is not configured' }, { status: 500 })
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      // _replyto lets Formspree set the reply-to header to the sender.
      body: JSON.stringify({ name, email, message, _replyto: email }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[/api/contact] Formspree rejected:', res.status, detail)
      return NextResponse.json({ error: 'Could not send message' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Contact submission failed'
    console.error('[/api/contact]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
