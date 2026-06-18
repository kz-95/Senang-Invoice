/**
 * Returns the API base URL depending on the runtime environment.
 *
 * - On web (browser / SSR): returns '' (empty string), so fetch('/api/...')
 *   continues to work exactly as before.
 * - When Capacitor is running on a native device (Android / iOS): returns
 *   'http://127.0.0.1:3001' so the app can reach the dev server running on
 *   the same machine.
 *
 * This is safe to call during SSR because it guards against `window` being
 * undefined. It also avoids importing from @capacitor/core at the module
 * level so the dependency is not required at build time.
 */
export function apiBase(): string {
  if (typeof window === 'undefined') return ''
  try {
    const win = window as any
    if (win.Capacitor?.isNativePlatform?.()) {
      return 'http://127.0.0.1:3001'
    }
  } catch {
    // Capacitor not available
  }
  return ''
}
