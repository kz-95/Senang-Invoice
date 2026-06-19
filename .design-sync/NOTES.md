# design-sync NOTES — SenangInvoice

This repo is a **Next.js app**, not a published component library. The converter
expects a packaged DS, so a few in-place accommodations are needed:

- **No `dist/` / no Storybook.** Build runs in synth-from-src mode driven by
  `componentSrcMap` in `config.json` (23 components across common/layout/invoice/
  dashboard/review).
- **Package self-junction.** The converter resolves the package at
  `node_modules/<pkg>` (`pkg = senanginvoice`). Since the app isn't installed as
  a node module, create a junction once per clone:
  `New-Item -ItemType Junction -Path node_modules\senanginvoice -Target <repoRoot>`
  (gitignored; recreate on fresh clone). `scripts/ds-bundle.mjs` re-stages the
  `node_modules/senanginvoice` package dir (package.json + tsconfig + compiled.css
  + `src` junction) on every run, so just run that wrapper.
- **Heap.** ts-morph resolves the full type graph (react@19 + all `@types`),
  which OOMs at the 4GB default. Build with `NODE_OPTIONS=--max-old-space-size=8192`.
- **One-command build:** `node scripts/ds-bundle.mjs` (add `--no-validate` to skip
  the render check). It compiles Tailwind, stages the package dir, builds, validates.

## Build infrastructure (how the app code is made bundle-safe)
- **Tokens / CSS — derived from the REAL theme.** `cssEntry` = `.design-sync/compiled.css`,
  compiled from `_tw-input.css` with **`.design-sync/tailwind.bundle.ts`** (NOT the bare
  app config). That bundle config imports `../tailwind.config.ts` and **safelists** the
  full brand palette so `_ds_bundle.css` ships ALL brand scales (teal + success/warning/
  danger), not just classes the components happen to use. Brand tokens also ship as
  `var(--color-*)` custom properties: the `:root` block in **`.design-sync/_tw-input.css`**
  mirrors `theme.extend` and compiles into `_ds_bundle.css`. (`cfg.tokensGlob` is NOT used
  — it resolves under node_modules, not repo paths, so it no-ops for an in-repo file.)
  The wrapper regenerates `compiled.css` before every build.
- **`next/*` stubs.** `cfg.tsconfig` = **`.design-sync/tsconfig.bundle.json`** which maps
  `next/link` + `next/navigation` to `.design-sync/stubs/*` so layout/nav components
  bundle and render statically (no App Router). ⚠️ The converter's tsconfig comment-
  stripper is naive: **the bundle tsconfig must be pure JSON with NO comments and NO
  `include` array** — a `/*`…`*/` (from `@/*` + `**/*` globs) or a `"//"` key silently
  breaks path parsing → real `next` gets bundled (look for `__NEXT_*`/`app-router-context`
  in `_ds_bundle.js` to detect this regression).
- **`process.env` shim.** `.design-sync/stubs/shim-process.ts` is imported FIRST in
  `ds-entry.tsx` (before any component) so app modules that read env at load
  (`lib/constants.ts`, `services/data/llmKeyRepository.ts`) don't throw "process is not
  defined" and crash the whole IIFE bundle.
- **Store export for seeding.** `ds-entry.tsx` also exports `useInvoiceStore` on the
  global so `ExtractedItemsTable`/`LineItemEditor` previews seed the SAME bundled store
  instance (a source-imported copy is a different singleton).
- **Preview fixtures.** `.design-sync/fixtures/invoice.ts` holds mock invoice/line data;
  previews import it (bundled from source, never shipped as a component).

## Scoped components (23)
common: Button, Input, Select, Spinner, Modal, EmptyState, ConfirmDialog, LangToggle.
layout: AppShell, TopBar, BottomNav, PageHeader, Fab. dashboard: StatTile.
invoice: StatusPill, QrBadge, SearchBar, DateFilter, BulkActionBar, InvoiceCard, InvoiceList.
review/tables: ExtractedItemsTable, LineItemEditor.
Excluded: Snackbar/Toast (live toast store → render empty), DemoBanner/RecentInvoices
(Dexie live data → empty statically), and all marketing/ai/settings components (heavier
coupling). All 23 scoped components have authored previews graded good — none ship as
floor cards anymore except the three original overlays below.

## Known render warns (expected — not failures)
- `ConfirmDialog`, `Modal`, `Select` ship as **floor cards** (typographic) — overlays/
  portals that render empty statically. Acceptable; author previews with
  `cfg.overrides.<Name>: {"cardMode":"single"}` if richer cards are wanted later.
- `[RENDER_THIN] Spinner` — `animate-spin` SVG, nothing static to paint. Correct.
- `[FONT_REMOTE] Inter` — remote `@import` (Google Fonts) in `_tw-input.css`. Info only.
- `tokens: N missing (below threshold)` — non-blocking.

## d.ts contracts
Synth-from-src can't extract props (every `<Name>Props` resolves to
`[key: string]: unknown`). Hand-written prop bodies live in `cfg.dtsPropsFor` for all
components with props — **update them if a component's props change**.

## Re-sync risks
- `compiled.css` is generated, not committed — the wrapper regenerates it; if running
  the driver directly, recompile with `tailwind.bundle.ts` first (else `cssEntry` stale).
- The `node_modules/senanginvoice` junction is gitignored — recreate on a fresh clone
  (the wrapper does this).
- The `:root` tokens in `_tw-input.css` and `dtsPropsFor` are hand-mirrored from
  `tailwind.config.ts` and the component sources — re-check if the theme/props change.
- `tsconfig.bundle.json` must stay comment-free (see Build infrastructure) or `next/*`
  stubbing silently breaks.
- New components: confirm they don't pull live Dexie data at render; if they read a
  store, export it on the global and seed it in the preview. If they import other
  `next/*` subpaths, add stubs + tsconfig paths entries.
