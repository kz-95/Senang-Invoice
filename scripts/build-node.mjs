// Compiles the framework-agnostic services in src/services (+ src/lib) to
// CommonJS under nodejs/services/ so the on-device Node server can require them.
//
// tsc does NOT copy .json files or rewrite the "@/*" path alias, so we:
//   1. compile with tsconfig.node.json (emits nodejs/services/{services,lib}/...)
//   2. copy src/data/*.json -> nodejs/services/data/ (for "@/data/*.json" imports)
// The "@/*" runtime alias is resolved by module-alias, registered in nodejs/index.js.

import { execSync } from 'node:child_process'
import { rmSync, mkdirSync, readdirSync, copyFileSync, existsSync } from 'node:fs'
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

console.log('[build-node] done')
