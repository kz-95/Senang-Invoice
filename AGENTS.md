# AGENTS.md

## Git Workflow

- **Never commit or push directly to `main`.** All work happens on feature branches (`feat/*`, `fix/*`, `chore/*`).
- **`main` is merge-only.** Changes land on `main` exclusively via pull request merges or `git merge` from a feature branch. No direct commits, no `--force` push to `main`.
- Push to the feature branch, then merge to `main` via PR or `git merge`.

## Build Pipeline

```bash
scripts\build-apk.bat
```

Steps:
1. Stash `src/app/api/` → `src/app/_api_stashed/` (API routes break static export)
2. `npx next build` (production static export to `out/`)
3. Restore API routes from stash, delete `out/sw.js` and `out/manifest.json`, copy `nodejs/` to `out/nodejs/`
4. `npx cap sync android` + `gradlew assembleDebug`
5. Auto-clean `.next/` and `out/` so `npm run dev` works after APK build

After build, run `npm run dev` for desktop testing — Step 5 wipes production build caches.

## Current Architecture

### AppShell Layout
```
min-h-dvh flex flex-col
  TopBar (shrink-0)
  DemoBanner (conditional, shrink-0)
  <main flex flex-col flex-1 overflow-y-auto overflow-x-hidden
         max-w-2xl mx-auto px-4 py-4
         style: paddingBottom = calc(96px + env(safe-area-inset-bottom))>
  BottomNav (fixed bottom-0 z-40, lg:hidden)
  Fab (conditional)
  Snackbar
```

Key: `overflow-y-auto` on `<main>` makes all pages scrollable. Pages needing sticky-bottom (Create) use `flex-1 min-h-0` on the wrapper and `shrink-0` for the bottom bar.

### Create Page Layout
```
flex flex-col flex-1 min-h-0 -mx-4 -my-4
  Scroll area (flex-1 overflow-y-auto px-4 py-4)
    PageHeader, Items Table, Editor, Buyer, Invoice Number, Advanced, Generate
  Toolbox (shrink-0, border-t, shadow)
    [▼ Add Items] clickable toggle bar
    (expanded: max-h 50vh) Camera/Voice/Manual panel
```

### Ask Page Layout
```
flex flex-col flex-1 min-h-0 -mx-4 -mb-4
  Title + Scope Check button (shrink-0)
  ScopeCheckCard (conditional, shrink-0)
  ChatWindow (flex-1 min-h-0)
    Messages (flex-1 overflow-y-auto)
    Input form (shrink-0, border-t, safe-area bottom padding)
```

### LLM Key System
- **Disabled/Greyed out** — "Coming Soon" badge on `LlmKeyManager`
- **Hardcoded fallback key** active in `useExtraction.ts` and `useAsk.ts` (via `NEXT_PUBLIC_LLM_FALLBACK_KEY` env var)
- `useHasLlmKey()` always returns `true` → `NoLlmBanner` never shows
- `seedLlmKeys()` removed from `seed.ts` — no demo keys in IndexedDB

### Demo Mode
- **Auto-seed on first load** — `DemoBanner` detects no data + unlocked, auto-runs `seedDemoData()`
- **"Example" badge** on all seeded invoices (`invoice.id.startsWith('demo-inv-')`)
- **Clear button** in DemoBanner removes all demo data
- Dismiss button hides the banner
- 6 demo invoices: 1 pending, 2 validated, 1 synced, 1 archived, 1 trash

### Profile Page
- **Advanced link** → opens MyInvois ERP Credentials modal directly (PIN gate removed)
- Collapsible hints for TIN, SST Reg No, MSIC Code
- Invoice Numbering Settings collapsible → inline `NumberPresetManager` CRUD
- Profile loads from IndexedDB via `useProfile()` hook; `NumberPresetManager` has fallback DB load

### RAG / Ask System
- **Retriever** (`src/services/rag/retriever.ts`): keyword-overlap matching with `MIN_SCORE=2` threshold
- Short tokens (B2B, TIN, QR, SST, etc.) preserved via `KEEP_SHORT` set
- Degraded path (no LLM): returns "no matching knowledge" when 0 chunks, raw chunk text when matched
- LLM path: lets model answer from general knowledge when 0 chunks matched

### Capacitor Plugins
- `capacitor-nodejs` (custom tgz) — Node.js runtime in APK
- `capacitor-voice-recorder` — native mic permission for Android WebView

## Knowledge Base Maintenance

When you add, remove, or change any feature, flow, or behavior in this app, update the RAG knowledge chunks in `src/data/irbm-knowledge.json` accordingly. Every user-facing change must be reflected so the Ask chat stays accurate.

### Rules

- **Feature changes → update app-* chunks.** If you rename a button, change a flow, add a capture mode, or modify LLM key setup, update the relevant app-* chunk text.
- **IRBM regulation updates → update regulation chunks.** If tax rules, deadlines, thresholds, or codes change, update the relevant regulatory chunks.
- **New features → add new chunks.** When you implement a feature that users will ask about, add app-specific knowledge chunks.
- **Removed features → delete or deprecate chunks.** If a feature is removed (e.g., copilot), remove or mark deprecated its knowledge chunks.
- **Keep topics and ids stable.** The `id` and `topic` fields are the chunk identity - don't rename them unless the topic fundamentally changes. Update `text` in place.

## Knowledge Chunk Index

36 chunks in `src/data/irbm-knowledge.json`.

### IRBM Regulations (20 chunks)

| id | topic | covers |
|----|-------|--------|
| `exemption` | RM1m exemption rule | Turnover threshold, corporate group rule, voluntary opt-in |
| `phases` | Implementation phases | Aug 2024 / Jan 2025 / Jul 2025 rollout |
| `consolidated` | Consolidated invoice rules | B2C only, 7-day window, RM10k limit, code 004 |
| `non-consolidatable` | Non-consolidatable categories | 10 prohibited industries |
| `correction` | 72-hour correction window | Cancel/amend vs credit/debit note |
| `penalties` | Penalties for non-compliance | RM200k fine, 2yr imprisonment |
| `tin-format` | TIN format requirements | Prefix letters, digit count, EI00000000010 |
| `ubl` | UBL 2.1 format | Required fields, JSON structure |
| `qr-code` | QR code requirement | URL format, verification |
| `classification` | IRBM classification codes | 45 codes overview, notable codes |
| `classification-categories` | Classification code categories | Industry groupings, common codes |
| `how-to-choose-code` | Selecting classification codes | Decision guide, common mistakes |
| `b2b-b2c-b2g` | B2B vs B2C vs B2G | Buyer type differences, TIN rules |
| `credit-debit-notes` | Credit and debit notes | Issuance rules, UUID linking |
| `self-billed` | Self-billed e-invoices | Buyer-issued, IRBM approval |
| `common-errors` | Common validation errors | ERR236-ERR500 codes and fixes |
| `voluntary-opt-in` | Voluntary opt-in | Benefits, process, no opt-out |
| `foreign-currency` | Foreign currency handling | MYR conversion, Bank Negara rates |
| `record-keeping` | Record keeping | 7-year retention, audit requirements |
| `payment-timeline` | Submission timeline | 7-day window, validation speed |

### MyInvois Procedures (4 chunks)

| id | topic | covers |
|----|-------|--------|
| `registration-procedure` | How to register | 6-step portal registration |
| `issuance-workflow` | Issuance process | 7-step create→validate→deliver |
| `portal-usage` | MyInvois portal | Manual, spreadsheet, API methods |
| `api-integration` | API integration | OAuth, endpoints, sandbox |

### App Usage (11 chunks)

| id | topic | covers |
|----|-------|--------|
| `app-how-to-create` | Creating invoices | + button, capture modes, item list, buyer, generate |
| `app-capture-modes` | Camera/Voice/Manual | Three input modes at bottom of card; list section above; voice 60s limit WhatsApp-style |
| `app-ai-extraction` | AI extraction | How AI extracts items and codes |
| `app-seller-profile` | Setting up profile | TIN, SST, MSIC, address fields |
| `app-ask-feature` | Ask chat feature | Multilingual Q&A, scope checker |
| `app-demo-mode` | Demo mode | Auto-seed on first load, Example tags, Clear button |
| `app-llm-keys` | Managing LLM keys | Coming Soon — built-in key active for extraction and chat |
| `app-invoice-history` | Invoice history | 5 tabs: Pending/Validated/Synced/Archived/Trash; date presets; search; sort; archive/trash lifecycle |
| `app-auto-categorizer` | Auto-categorization | AI assigns classification codes with confidence scores |
| `app-language` | Language settings | EN, MS, ZH |
| `app-numbering-presets` | Numbering presets | Configurable invoice number patterns with custom tokens |
| `app-navigation` | Bottom navigation | 5 tabs: Ask, Home, (+) Create (FAB), Profile, Settings |

## Known Issues & Limitations

See `docs/issues.md` for the full list of unresolved issues, attempted fixes, and suggested approaches.

Key unresolved:
- Google Drive sync not working in APK
- OCR extraction fails in APK (429 / network / Node.js bridge)
- Voice mic permission unreliable on Xiaomi WebView
- No fallback chain for 429 rate limits on extraction/voice/chat
- Next.js prefetches marketing pages causing ~1GB memory spikes in dev

## Related Docs

- `docs/rag-design.md` - RAG architecture, retriever algorithm, limitations
- `docs/issues.md` - Unresolved issues, attempted approaches, suggestions
