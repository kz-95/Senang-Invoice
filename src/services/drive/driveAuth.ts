const GOOGLE_TOKEN_KEY = 'google_access_token'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

import { safeGetRandomValues } from '@/lib/crypto'

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

// === Platform detection ===

async function isNativePlatform(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform?.() ?? false
  } catch {
    return false
  }
}

// === Native OAuth (Authorization Code + PKCE via system browser) ===
//
// In a Capacitor WebView the GIS implicit popup opens an external browser tab
// whose token callback can never reach back into the app. Instead we run the
// standard installed-app flow: open Google's consent page in a Custom Tab, get
// the code back through the registered custom URL scheme, then exchange it for
// an access token using PKCE (public client, no secret).
//
// Requires an "iOS"-type OAuth client (bundle id = com.senanginvoice) in Google
// Cloud Console; its reversed-client-id scheme is the redirect target. Set
// NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID to that client id.

function base64UrlEncode(bytes: Uint8Array): string {
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomVerifier(): string {
  const bytes = safeGetRandomValues(32)
  return base64UrlEncode(bytes)
}

async function challengeFromVerifier(verifier: string): Promise<string> {
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
    return base64UrlEncode(new Uint8Array(digest))
  } catch {
    // WebView without crypto.subtle — fallback to verifier as challenge (non-PKCE)
    return verifier
  }
}

/** Build `com.googleusercontent.apps.<id>` reversed scheme from an iOS client id. */
function reversedScheme(nativeClientId: string): string {
  const id = nativeClientId.replace(/\.apps\.googleusercontent\.com$/, '')
  return `com.googleusercontent.apps.${id}`
}

async function getAccessTokenNative(): Promise<string> {
  const nativeClientId = process.env.NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID
  if (!nativeClientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID is not set (iOS-type OAuth client for native sign-in)')
  }

  const { Browser } = await import('@capacitor/browser')
  const { App } = await import('@capacitor/app')

  const redirectUri = `${reversedScheme(nativeClientId)}:/oauth2redirect`
  const verifier = randomVerifier()
  const challenge = await challengeFromVerifier(verifier)
  const state = randomVerifier()

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', nativeClientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', DRIVE_SCOPE)
  authUrl.searchParams.set('code_challenge', challenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  authUrl.searchParams.set('state', state)

  const code = await new Promise<string>((resolve, reject) => {
    let settled = false
    let handle: { remove: () => void } | null = null

    const cleanup = () => {
      if (handle) handle.remove()
    }

    App.addListener('appUrlOpen', (event: { url: string }) => {
      if (!event.url.startsWith(reversedScheme(nativeClientId))) return
      if (settled) return
      settled = true
      cleanup()
      void Browser.close()

      try {
        // Custom-scheme URLs use `scheme:/path?query`; normalise so URL parses.
        const parsed = new URL(event.url.replace(/^[^?]*\?/, 'https://x/?'))
        const returnedState = parsed.searchParams.get('state')
        const returnedCode = parsed.searchParams.get('code')
        const error = parsed.searchParams.get('error')
        if (error) return reject(new Error(`Google sign-in failed: ${error}`))
        if (returnedState !== state) return reject(new Error('OAuth state mismatch'))
        if (!returnedCode) return reject(new Error('No authorization code returned'))
        resolve(returnedCode)
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Failed to parse OAuth redirect'))
      }
    }).then((h: { remove: () => void }) => { handle = h })

    Browser.open({ url: authUrl.toString() }).catch((e: unknown) => {
      if (settled) return
      settled = true
      cleanup()
      reject(e instanceof Error ? e : new Error('Could not open Google sign-in'))
    })
  })

  // Exchange the code for an access token (PKCE public client, no secret).
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: nativeClientId,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    throw new Error(`Token exchange failed (${tokenRes.status}): ${errText.slice(0, 200)}`)
  }

  const token = await tokenRes.json() as TokenResponse
  if (!token.access_token) throw new Error('Token exchange returned no access_token')

  const { settingsRepository } = await import('@/services/data/settingsRepository')
  await settingsRepository.set(GOOGLE_TOKEN_KEY, {
    token: token.access_token,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
  })

  return token.access_token
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve) => {
    const w = window as unknown as { google?: { accounts?: { oauth2?: unknown } } }
    if (w.google?.accounts?.oauth2) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

export async function getAccessToken(): Promise<string | null> {
  // Native APK: GIS popup can't return into the WebView. Use the system-browser
  // Authorization Code + PKCE flow instead.
  if (await isNativePlatform()) {
    return getAccessTokenNative()
  }

  await loadGisScript()
  console.log('[Drive] GIS script loaded')

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  console.log('[Drive] Client ID:', clientId ? `${clientId.slice(0, 20)}...` : 'NOT SET')
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set')
  }

  type GoogleOAuth2 = {
    initTokenClient: (config: {
      client_id: string
      scope: string
      callback: (response: TokenResponse) => void
    }) => { requestAccessToken: () => void }
  }

  const google = (window as unknown as { google: { accounts: { oauth2: GoogleOAuth2 } } }).google

  return new Promise((resolve, reject) => {
    let resolved = false
    let focusTimeout: ReturnType<typeof setTimeout> | null = null

    const finish = (token: string | null, err?: string) => {
      if (resolved) return
      resolved = true
      if (focusTimeout) clearTimeout(focusTimeout)
      window.removeEventListener('focus', onFocus)
      if (token) resolve(token)
      else reject(new Error(err || 'Sign-in cancelled'))
    }

    const onFocus = () => {
      focusTimeout = setTimeout(() => {
        finish(null, 'Sign-in was closed without completing')
      }, 3000)
    }

    window.addEventListener('focus', onFocus)

    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: async (response) => {
        console.log('[Drive] OAuth response received:', response ? 'yes' : 'no')
        const token = response?.access_token
        if (token) {
          console.log('[Drive] Token obtained, storing...')
          const { settingsRepository } = await import('@/services/data/settingsRepository')
          await settingsRepository.set(GOOGLE_TOKEN_KEY, {
            token,
            expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
          })
          finish(token)
        } else {
          console.error('[Drive] OAuth failed - no token in response', response)
          finish(null, 'Google sign-in was cancelled or failed')
        }
      },
    })

    try {
      client.requestAccessToken()
    } catch (e) {
      console.error('[Drive] requestAccessToken failed:', e)
      finish(null, 'Could not open Google sign-in. Popups may be blocked.')
    }
  })
}

export async function getOrRefreshToken(): Promise<string> {
  const { settingsRepository } = await import('@/services/data/settingsRepository')
  const stored = await settingsRepository.get<{ token: string; expiresAt: number }>(GOOGLE_TOKEN_KEY)

  if (stored && stored.expiresAt > Date.now() + 60000) {
    return stored.token
  }

  const token = await getAccessToken()
  if (!token) throw new Error('Could not obtain Google access token')
  return token
}

export async function isGoogleAuthenticated(): Promise<boolean> {
  const { settingsRepository } = await import('@/services/data/settingsRepository')
  const stored = await settingsRepository.get<{ token: string; expiresAt: number }>(GOOGLE_TOKEN_KEY)
  return !!stored && stored.expiresAt > Date.now()
}

export async function signOutGoogle(): Promise<void> {
  const { settingsRepository } = await import('@/services/data/settingsRepository')
  const stored = await settingsRepository.get<{ token: string }>(GOOGLE_TOKEN_KEY)

  if (stored?.token) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(stored.token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  await settingsRepository.set(GOOGLE_TOKEN_KEY, null)
}
