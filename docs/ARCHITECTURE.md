# Architecture

## Stack

- **Next.js 15** (App Router, TypeScript strict, static export)
- **Tailwind CSS** - teal brand palette
- **Dexie.js** (IndexedDB) - local-first storage, no server DB
- **Zustand** - client state
- **pdf-lib** / **qrcode** - PDF + QR generation
- **Multi-provider LLM** - Gemini for vision, DeepSeek for text; key rotation, 429 cooldown, fallback chain
- **@ducanh2912/next-pwa** - offline-capable PWA (workbox 7)
- **Capacitor** - Android APK packaging with embedded Node.js server

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Landing page, About, Support, Guide (static)
│   │   ├── page.tsx            # Landing with Download CTA
│   │   ├── about/page.tsx      # About page
│   │   ├── support/page.tsx    # Contact form (Formspree)
│   │   └── guide/page.tsx      # Multilingual guides (EN/MS/ZH)
│   ├── (app)/              # PWA shell (logged-in experience)
│   │   ├── layout.tsx          # AppShell: TopBar, BottomNav, DemoBanner
│   │   ├── dashboard/page.tsx  # Invoice history (5 tabs)
│   │   ├── create/page.tsx     # Invoice creation
│   │   ├── invoice/page.tsx    # Invoice detail (?id=)
│   │   ├── ask/page.tsx        # AI chat (RAG)
│   │   ├── settings/page.tsx   # Settings + demo unlock
│   │   └── profile/page.tsx    # Seller profile
│   ├── welcome/[step]/    # 3-step onboarding (desktop skip)
│   │   ├── 1/ → intro
│   │   ├── 2/ → scope check
│   │   └── 3/ → Google Drive connect (skippable)
│   ├── api/                # Next.js API routes (web only)
│   │   ├── extract/route.ts    # LLM extraction
│   │   ├── ask/route.ts        # RAG chat
│   │   ├── ocr/route.ts        # Gemini Vision OCR
│   │   └── submit/route.ts     # MyInvois submission mock
│   └── layout.tsx          # Root layout (app detection)
├── components/
│   ├── layout/             # AppShell, TopBar, BottomNav, DemoBanner
│   ├── capture/            # Camera (webcam), Voice, Manual entry
│   ├── review/             # Line items, buyer, classification pickers
│   ├── invoice/            # Invoice cards, QR, filters
│   ├── ask/                # Chat window, suggested prompts, scope check
│   ├── settings/           # Settings panels
│   ├── auth/               # Auth gates
│   ├── onboarding/         # Welcome flow steps
│   ├── marketing/          # Landing page sections
│   ├── dashboard/          # Invoice history tabs
│   ├── llm/                # LlmKeyManager (greyed out, Coming Soon)
│   ├── profile/            # Profile form, NumberPresetManager
│   ├── presets/            # Number preset CRUD
│   ├── guide/              # Guide content
│   ├── common/             # Shared UI (buttons, modals, etc.)
│   ├── sync/               # Google Drive status indicator
│   └── system/             # System-level components
├── hooks/                  # Orchestration - bind components to services + stores
├── stores/                 # Zustand state (profile, invoice, ask, demo, ui, llmKey)
├── services/
│   ├── ai/                 # llmClient, extractionService, askService, mappingService
│   ├── invoice/            # UBL builder, validation, PDF, QR
│   ├── compliance/         # Classification codes, UOM, TIN, scope check
│   ├── data/               # IndexedDB repositories
│   ├── drive/              # Google Drive auth + sync
│   ├── ocr/                # OCR via Gemini Vision
│   └── rag/                # Knowledge store + keyword retriever
├── data/                   # Static bundled data
│   ├── classification-codes.json   # 45 IRBM codes
│   ├── uom-codes.json              # 41 UN/ECE UOM codes
│   └── irbm-knowledge.json         # 36 RAG knowledge chunks
└── lib/                    # Types, constants, seed data, shared utils
```

## Layering Contract

| Layer | Can import | Cannot import |
|-------|-----------|---------------|
| Components | hooks | services, stores, fetch |
| Hooks | services, stores | React from services |
| Services | other services, data, lib | React, hooks, components |
| API Routes | services | - |
| Stores | services (minimal) | React components |
| Lib | nothing (base) | - |

## Data Model

IndexedDB via Dexie.js - no server-side database.

| Table | Key entities |
|-------|-------------|
| `invoices` | Invoice (status, seller, buyer, lines, totals, UBL, validation, PDF ref) |
| `pdfs` | Blob storage for generated PDFs |
| `settings` | Generic key-value (seller profile, config) |
| `llmKeys` | LLM API keys (provider, model, key, priority, active, fallback) |

### Key Types

- **SellerProfile** - business name, TIN, SST reg, MSIC code, address
- **Invoice** - draft/validated/synced, with line items, UBL JSON, validation result
- **LineItem** - description, qty, UOM, unit price, amount, classification code, tax type
- **Buyer** - general public or TIN-based (BRN/NRIC/PASSPORT)
- **ValidationResult** - UUID, longId, QR link, validated timestamp
- **LlmKeyRow** - label, provider, apiKey, model, baseUrl, isActive, isFallback, priority

## Dual-Runtime Architecture

SenangInvoice runs in two modes: **web** (browser/Vercel) and **native APK** (Android).

### Web Mode

Next.js API routes handle all backend calls. The `apiBase()` helper returns `""` (same-origin), so the browser calls `/api/...` which hits Next.js serverless functions (Vercel) or the local dev server.

### APK Mode

The APK bundles a Node.js HTTP server (`nodejs/index.js`) that runs on `127.0.0.1:3001` via the `capacitor-nodejs` plugin. On native platform, `apiBase()` returns `http://127.0.0.1:3001`, routing all API calls to the local Node.js process.

The Node.js server mirrors the web API routes:
- `POST /api/extract` - LLM extraction
- `POST /api/ask` - RAG chat
- `POST /api/ocr` - Gemini Vision OCR
- `POST /api/submit` - MyInvois submission mock

LLM keys are baked into the APK at build time via `scripts/build-node.mjs`, which reads `SENANG_LLM_KEYS` from `.env.local` and writes them to:
- `nodejs/env-keys.js` (CommonJS module)
- `nodejs/.env.json` (JSON fallback)

These files are `.gitignore`-d and never committed.

## Build Pipeline

```
scripts/build-apk.bat
```

1. Stash `src/app/api/` → `src/app/_api_stashed/` (API routes break static export)
2. `npx next build` (production static export to `out/`)
3. Restore API routes, delete `out/sw.js` + `out/manifest.json`, copy `nodejs/` to `out/nodejs/`
4. `npx cap sync android` + `gradlew assembleDebug`
5. Auto-clean `.next/` and `out/` for dev mode

## Extraction Pipeline

```
1. Photo captured (base64 via webcam / Capacitor Camera)
        ↓
2. OCR (Gemini Vision API, gemini-2.5-flash)
   Image → text transcript
        ↓
3. LLM extraction
   Text → structured items (description, qty, unitPrice)
        ↓
4. AI mapping (mappingService)
   Classification codes, UOM, tax type assigned with confidence scores
```

OCR uses Gemini's vision model to read receipt text from images. No local Python/RapidOCR server.

## LLM Key Flow

Keys are **server-side only**. No keys are placed in `NEXT_PUBLIC_*` env vars.

```
.env.local (SERVER-ONLY)            API Route / Node.js Server
SENANG_LLM_KEYS=gemini:KEY,...
   │
   ├── Web: Next.js reads process.env.SENANG_LLM_KEYS
   │
   └── APK: build-node.mjs bakes keys into nodejs/
            nodejs/index.js loads from env-keys.js → .env.json → process.env
```

| Provider | Model | Use |
|----------|-------|-----|
| Gemini | gemini-2.5-flash | Vision (OCR), fallback text |
| DeepSeek | deepseek-v4-flash | Primary text (extraction, chat) |

**Fallback chain**: rotates through keys on failure → switches model when all keys exhausted → degrades gracefully (RAG-only for Ask, empty items for Extract).

## RAG Design

See `docs/rag-design.md` for the full RAG architecture.

## Capacitor Plugins

- `capacitor-nodejs` (custom tgz) - Node.js runtime in APK
- `capacitor-voice-recorder` - native mic permission for Android WebView
- `capacitor-camera` - native camera for photo capture
