/**
 * Provider-agnostic funnel analytics.
 *
 * Call `track(event, props)` anywhere. Events are forwarded to whichever
 * provider is present at runtime (Plausible, PostHog, or GA/gtag) and, if
 * configured, POSTed to an internal collector. No provider is hard-wired —
 * pick one later by injecting its snippet; this layer stays unchanged.
 */

export type FunnelEvent =
  | 'landing_view'
  | 'onboarding_start'
  | 'onboarding_slide_view'
  | 'onboarding_skip'
  | 'onboarding_complete'
  | 'drive_connect_click'
  | 'drive_skip'
  | 'profile_start'
  | 'profile_complete'
  | 'apk_download_click'
  | 'playstore_badge_click'
  | 'first_invoice_created'

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>

// Optional internal collector endpoint (e.g. '/api/track'). Empty = disabled.
const COLLECTOR = process.env.NEXT_PUBLIC_ANALYTICS_URL ?? ''

interface ProviderWindow extends Window {
  plausible?: (event: string, opts?: { props?: AnalyticsProps }) => void
  posthog?: { capture: (event: string, props?: AnalyticsProps) => void }
  gtag?: (command: string, event: string, props?: AnalyticsProps) => void
}

export function track(event: FunnelEvent, props: AnalyticsProps = {}): void {
  if (typeof window === 'undefined') return
  const w = window as ProviderWindow

  try {
    if (typeof w.plausible === 'function') {
      w.plausible(event, { props })
    } else if (w.posthog?.capture) {
      w.posthog.capture(event, props)
    } else if (typeof w.gtag === 'function') {
      w.gtag('event', event, props)
    } else if (process.env.NODE_ENV !== 'production') {
      // No provider yet — surface events in dev so the funnel is visible.
      console.debug('[analytics]', event, props)
    }
  } catch {
    // never let analytics break the UI
  }

  if (COLLECTOR) {
    try {
      const body = JSON.stringify({ event, props, ts: Date.now(), path: window.location.pathname })
      // keepalive so events survive navigation/unload
      void fetch(COLLECTOR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    } catch {
      // ignore
    }
  }
}
