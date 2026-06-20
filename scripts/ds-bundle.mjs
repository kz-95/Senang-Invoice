#!/usr/bin/env node
/**
 * One-command design-sync bundler for SenangInvoice.
 *
 * SenangInvoice is a Next.js APP, not a packaged component library, so the
 * design-sync converter needs a few in-place accommodations. This script does
 * them all, then builds + validates the bundle into ./ds-bundle:
 *
 *   1. Compile a standalone Tailwind stylesheet (.design-sync/compiled.css)
 *      from .design-sync/_tw-input.css — components use utility classes with no
 *      shipped stylesheet, and next/font is unavailable in the standalone bundle.
 *   2. Fake the package install the converter expects: a real
 *      node_modules/senanginvoice/ dir holding package.json + tsconfig.json +
 *      compiled.css, plus a junction src -> repo/src (no node_modules recursion).
 *   3. Build with an 8 GB heap (ts-morph OOMs at the 4 GB default on a full app
 *      type graph).
 *   4. Validate (render check) — pass --no-validate to skip.
 *
 * After this exits 0, the bundle in ./ds-bundle is ready; upload it via the
 * DesignSync tool (see .design-sync/NOTES.md). Re-run any time the components
 * or tokens change.
 *
 * Usage: node scripts/ds-bundle.mjs [--no-validate]
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, copyFileSync, rmSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'

const REPO = process.cwd()
const PKG = 'senanginvoice'
const PKG_DIR = join(REPO, 'node_modules', PKG)
const HEAP = '--max-old-space-size=8192'
const skipValidate = process.argv.includes('--no-validate')

const isWin = process.platform === 'win32'
const npx = isWin ? 'npx.cmd' : 'npx'

function run(cmd, args, extraEnv = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`)
  const r = spawnSync(cmd, args, {
    cwd: REPO,
    stdio: 'inherit',
    shell: isWin, // .cmd shims need a shell on Windows
    env: { ...process.env, ...extraEnv },
  })
  if (r.status !== 0) {
    console.error(`\n✗ step failed (exit ${r.status}): ${cmd} ${args.join(' ')}`)
    process.exit(r.status ?? 1)
  }
}

// ── 1. Compile the standalone Tailwind stylesheet ──────────────────────────
run(npx, [
  'tailwindcss',
  // Bundle config derives from the real app theme AND safelists the full brand
  // palette so _ds_bundle.css ships the complete token set (not just used classes).
  '-c', '.design-sync/tailwind.bundle.ts',
  '-i', '.design-sync/_tw-input.css',
  '-o', '.design-sync/compiled.css',
  '--minify',
])

// ── 2. Fake the package install (real dir + src junction) ──────────────────
if (existsSync(PKG_DIR)) rmSync(PKG_DIR, { recursive: true, force: true })
mkdirSync(PKG_DIR, { recursive: true })
copyFileSync(join(REPO, 'package.json'), join(PKG_DIR, 'package.json'))
copyFileSync(join(REPO, 'tsconfig.json'), join(PKG_DIR, 'tsconfig.json'))
copyFileSync(join(REPO, '.design-sync', 'compiled.css'), join(PKG_DIR, 'compiled.css'))
// junction (Windows) / dir symlink (posix) so node_modules/senanginvoice/src -> repo/src
symlinkSync(join(REPO, 'src'), join(PKG_DIR, 'src'), isWin ? 'junction' : 'dir')
console.log(`✓ staged ${PKG_DIR} (package.json + tsconfig.json + compiled.css + src junction)`)

// ── 3. Build the bundle ────────────────────────────────────────────────────
run('node', [
  '.ds-sync/package-build.mjs',
  '--config', '.design-sync/config.json',
  '--node-modules', './node_modules',
  '--entry', './.design-sync/ds-entry.tsx',
  '--out', './ds-bundle',
], { NODE_OPTIONS: HEAP })

// ── 4. Validate (render check) ─────────────────────────────────────────────
if (skipValidate) {
  console.log('\n(skipped validate — --no-validate)')
} else {
  run('node', ['.ds-sync/package-validate.mjs', './ds-bundle'], { NODE_OPTIONS: HEAP })
}

console.log('\n✓ ds-bundle ready → ./ds-bundle. Upload via the DesignSync tool (see .design-sync/NOTES.md).')
