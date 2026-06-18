const GOOGLE_TOKEN_KEY = 'google_access_token'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
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
          console.error('[Drive] OAuth failed — no token in response', response)
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
