// Produces the static export for the APK shell.
//
// `output: 'export'` cannot build POST route handlers, so we move src/app/api
// aside for the duration of the export and always restore it afterwards (even
// on failure). The on-device Node server (nodejs/) re-hosts those routes instead.
//
//   1. stash src/app/api -> src/app/_api_stashed
//   2. compile the Node service bundle (nodejs/services)
//   3. next build with BUILD_TARGET=apk -> out/
//   4. copy nodejs/ -> out/nodejs/ (capacitor-nodejs runs the project from webDir/nodejs)
//   5. restore src/app/api (finally)

import { execSync } from 'node:child_process'
import { existsSync, renameSync, rmSync, cpSync } from 'node:fs'

const API = 'src/app/api'
const STASH = 'src/app/_api_stashed'

function restore() {
  if (existsSync(STASH)) renameSync(STASH, API)
}

try {
  if (existsSync(API)) renameSync(API, STASH) // hide api routes from static export

  execSync('node scripts/build-node.mjs', { stdio: 'inherit' })
  execSync('npx next build', {
    stdio: 'inherit',
    env: { ...process.env, BUILD_TARGET: 'apk' },
  })

  // capacitor-nodejs executes the Node project from `<webDir>/nodejs`. The repo keeps
  // it at the root (so dev/build-node can compile in place); mirror it into out/ so
  // `cap sync` carries index.js + services + node_modules into the APK assets.
  rmSync('out/nodejs', { recursive: true, force: true })
  cpSync('nodejs', 'out/nodejs', { recursive: true })
} finally {
  restore() // always put api routes back, even if the build failed
}

console.log('[export-apk] static export ready in out/ (incl out/nodejs); node bundle in nodejs/services')
