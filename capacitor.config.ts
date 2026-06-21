/// <reference types="capacitor-nodejs" />
import type { CapacitorConfig } from '@capacitor/cli'

// Live-reload (dev) is gated behind env vars so the dev URL never ships in a release APK:
//   USB:   adb reverse tcp:3000 tcp:3000  →  CAP_LIVE=1 npx cap sync android   (host defaults to localhost, already cleartext-whitelisted)
//   Wi-Fi: CAP_LIVE=1 CAP_HOST=<PC-LAN-IP> npx cap sync android   (also needs that IP added to network_security_config.xml)
// Release: plain `npx cap sync android` → no server.url, loads bundled out/ assets.
const live = process.env.CAP_LIVE === '1'
const host = process.env.CAP_HOST || 'localhost'

const config: CapacitorConfig = {
  appId: 'com.senanginvoice',
  appName: 'SenangInvoice',
  webDir: 'out',
  server: live
    ? { url: `http://${host}:3000`, cleartext: true, androidScheme: 'https' }
    : { androidScheme: 'https' },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    CapacitorNodeJS: {
      nodeDir: 'nodejs',
      startMode: 'auto',
    },
  },
}

export default config
