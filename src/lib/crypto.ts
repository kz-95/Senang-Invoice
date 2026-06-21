/**
 * Safe crypto wrapper for Capacitor WebView where the global `crypto`
 * object may be undefined (some Xiaomi/OEM WebView builds).
 *
 * Uses the native Web Crypto API when available, falls back to Math.random().
 */

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.trunc(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function safeRandomUUID(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
  } catch { /* fall through */ }
  return uuidv4()
}

export function safeGetRandomValues(length: number): Uint8Array {
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint8Array(length)
      crypto.getRandomValues(arr)
      return arr
    }
  } catch { /* fall through */ }
  // Fallback: Math.random() x length
  const arr = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    arr[i] = Math.trunc(Math.random() * 256)
  }
  return arr
}
