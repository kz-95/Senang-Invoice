// Compiles the framework-agnostic services in src/services (+ src/lib) to
// CommonJS under nodejs/services/ so the on-device Node server can require them.
//
// tsc does NOT copy .json files or rewrite the "@/*" path alias, so we:
//   1. compile with tsconfig.node.json (emits nodejs/services/{services,lib}/...)
//   2. copy src/data/*.json -> nodejs/services/data/ (for "@/data/*.json" imports)
//   3. bake SENANG_LLM_* and SENANG_ALLOW_* env vars into nodejs/.env.json
//      so the on-device Node server has API keys in the APK (no .env file on device).
// The "@/*" runtime alias is resolved by module-alias, registered in nodejs/index.js.

import { execSync } from 'node:child_process'
import { rmSync, mkdirSync, readdirSync, copyFileSync, existsSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'nodejs/services'

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

console.log('[build-node] compiling services -> ' + OUT)
execSync('npx tsc --project tsconfig.node.json', { stdio: 'inherit' })

// Copy JSON data referenced via "@/data/*.json" value imports.
const DATA_SRC = 'src/data'
const DATA_OUT = join(OUT, 'data')
if (existsSync(DATA_SRC)) {
  mkdirSync(DATA_OUT, { recursive: true })
  let n = 0
  for (const f of readdirSync(DATA_SRC)) {
    if (f.endsWith('.json')) {
      copyFileSync(join(DATA_SRC, f), join(DATA_OUT, f))
      n++
    }
  }
  console.log(`[build-node] copied ${n} data json file(s) -> ${DATA_OUT}`)
}

// Bake LLM env keys into nodejs/.env.json so the on-device Node server
// has API keys available in the APK (no .env file on Android).
function loadDotEnv(path) {
  const map = {}
  if (!existsSync(path)) return map
  const text = readFileSync(path, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && val) map[key] = val
  }
  return map
}

const env = loadDotEnv('.env.local')
const baked = {}
for (const key of ['SENANG_LLM_KEYS', 'SENANG_LLM_MODEL', 'SENANG_LLM_FALLBACK', 'SENANG_ALLOW_ENV_LLM_KEYS', 'SENANG_ALLOW_KEY_SEED']) {
  if (env[key]) baked[key] = env[key]
}
if (Object.keys(baked).length > 0) {
  writeFileSync('nodejs/.env.json', JSON.stringify(baked, null, 2))
  console.log(`[build-node] baked ${Object.keys(baked).length} env keys -> nodejs/.env.json`)
} else {
  console.warn('[build-node] WARNING: No SENANG_LLM_KEYS found in .env.local — APK will have degraded RAG-only Ask chat')
}

console.log('[build-node] done')
