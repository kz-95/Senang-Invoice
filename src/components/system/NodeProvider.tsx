'use client'

import { useEffect, useState } from 'react'

export function NodeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancel = false
    let retries = 0
    const maxRetries = 10
    const baseDelay = 500

    async function start() {
      try {
        // Dynamic import to avoid bundling Capacitor in web builds
        const { Capacitor } = await import('@capacitor/core')
        if (!Capacitor?.isNativePlatform?.()) {
          // Not running natively — proceed immediately (uses same-origin /api/*)
          setReady(true)
          return
        }

        // Start the on-device Node.js server
        try {
          const { NodeJS } = await import('capacitor-nodejs')
          await NodeJS.start({ nodeModulesPath: 'nodejs/node_modules' })
        } catch (err) {
          console.warn('[NodeProvider] Failed to start NodeJS, will attempt health check anyway:', err)
        }

        // Poll health endpoint until Node server is ready
        const poll = async () => {
          while (retries < maxRetries && !cancel) {
            try {
              const res = await fetch('http://127.0.0.1:3001/health')
              if (res.ok) {
                setReady(true)
                return
              }
            } catch {
              // Server not ready yet, retry
            }
            retries++
            await new Promise((r) => setTimeout(r, baseDelay * Math.pow(1.5, retries)))
          }
          // Max retries reached — proceed anyway (degraded mode)
          console.warn('[NodeProvider] Node server health check failed after max retries, proceeding in degraded mode')
          setReady(true)
        }
        await poll()
      } catch {
        // Capacitor not available — web build, proceed immediately
        setReady(true)
      }
    }

    start()
    return () => { cancel = true }
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Starting services...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
