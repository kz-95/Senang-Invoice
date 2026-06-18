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
      disable: process.env.NODE_ENV === 'development',
      register: true,
      workboxOptions: { skipWaiting: true },
    })(nextConfig)
  }
} catch {
  console.warn('[next.config] next-pwa unavailable, continuing without PWA')
}

export default wrapped
