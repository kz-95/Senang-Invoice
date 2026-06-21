/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
}

if (process.env.BUILD_TARGET === 'apk') {
  Object.assign(nextConfig, {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,
  })
}

let wrapped = nextConfig
try {
  const { default: withPWAInit } = await import('@ducanh2912/next-pwa')
  if (typeof withPWAInit === 'function') {
    wrapped = withPWAInit({
      dest: 'public',
      // Disable PWA in APK builds — files are shipped locally, service worker
      // never detects new versions and caches stale assets forever.
      disable: process.env.NODE_ENV === 'development' || process.env.BUILD_TARGET === 'apk',
      register: true,
      workboxOptions: { skipWaiting: true },
    })(nextConfig)
  }
} catch {
  console.warn('[next.config] next-pwa unavailable, continuing without PWA')
}

export default wrapped
