import { NextResponse } from 'next/server'

/**
 * Returns the LLM keys for client-side seeding into Settings (IndexedDB).
 *
 * SECURITY: keys live ONLY in the server-side `SENANG_LLM_KEYS` env var — never
 * in a `NEXT_PUBLIC_*` var (which Next.js would inline into the browser bundle).
 * This route hands them to the local client at runtime instead of build time.
 *
 * Gating is server-side only. We do NOT trust the Host header (or any other
 * client-supplied header) for the access decision — those are spoofable on a
 * public deploy (`Host: localhost` would bypass a host check). Instead:
 *   - allowed automatically outside production (local `next dev`), and
 *   - in production, only when the operator explicitly opts in via
 *     SENANG_ALLOW_KEY_SEED=true (a server env flag the operator controls;
 *     it is never sent to the client and cannot be forged by a request).
 * If you deploy this app to a shared/public host, leave the flag unset so the
 * route never hands keys to remote visitors.
 */

interface SeedKey {
  provider: string
  apiKey: string
}

function seedingAllowed(): boolean {
  if (process.env.SENANG_ALLOW_KEY_SEED === 'true') return true
  return process.env.NODE_ENV !== 'production'
}

function parseKeys(raw: string): SeedKey[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(':')
      if (idx === -1) return null
      return { provider: entry.slice(0, idx).toLowerCase(), apiKey: entry.slice(idx + 1).trim() }
    })
    .filter((k): k is SeedKey => k !== null && k.apiKey.length > 0)
}

export async function GET() {
  if (!seedingAllowed()) {
    return NextResponse.json({ keys: [] }, { status: 403 })
  }

  const keys = parseKeys(process.env.SENANG_LLM_KEYS ?? '')
  return NextResponse.json({ keys })
}
