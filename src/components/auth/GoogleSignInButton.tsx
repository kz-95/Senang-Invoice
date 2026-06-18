'use client'
import { useState, useEffect, useCallback } from 'react'
import { getAccessToken, isGoogleAuthenticated } from '@/services/drive/driveAuth'

export function GoogleSignInButton() {
  const [clientId, setClientId] = useState<string | undefined>()
  const [signedIn, setSignedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [debugMessage, setDebugMessage] = useState('')

  useEffect(() => {
    const cid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    setClientId(cid)

    if (cid) {
      isGoogleAuthenticated().then((authed) => {
        setSignedIn(authed)
        setChecking(false)
      })
    } else {
      setChecking(false)
    }
  }, [])

  const handleClick = useCallback(async () => {
    setLoading(true)
    setDebugMessage('')
    try {
      await getAccessToken()
      setSignedIn(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setDebugMessage(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  if (!clientId) return null

  if (checking) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/70">
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (signedIn) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/90">
        <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Backup on</span>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white text-gray-700 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>
      {debugMessage && (
        <p className="text-xs text-yellow-200 mt-1">{debugMessage}</p>
      )}
    </div>
  )
}
