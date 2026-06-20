/**
 * Server-side device sniffing from the User-Agent header.
 *
 * Used to render different CTAs on the server (e.g. desktop = download,
 * mobile = log in). Best-effort only — UA strings are spoofable, so never
 * gate security on this, only presentation.
 */
const MOBILE_UA = /android|iphone|ipod|iemobile|blackberry|opera mini|mobile/i

export function isMobileUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  return MOBILE_UA.test(userAgent)
}
