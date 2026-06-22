# Tech Stack

Senang Invoice - a **local-first, mobile-first Malaysian e-invoice app**. One
Next.js codebase ships as both a website (Vercel) and an Android APK (Capacitor).
No backend database; all user data lives on-device.

## At a glance

| Layer | Choice | Version | Why |
|-------|--------|---------|-----|
| Framework | **Next.js** (App Router) | 15.5.19 | SSR for web + static export for APK |
| UI runtime | **React** | 19 | - |
| Language | **TypeScript** | 5.x | strict types end-to-end |
| Styling | **Tailwind CSS** | 3.4 | + `autoprefixer`; custom `Button`, no UI lib |
| State | **Zustand** | 5 | light global stores (`uiStore`, `demoStore`) |
| Local DB | **Dexie** (IndexedDB) | 4 | on-device invoice storage, offline-first |
| PWA | **@ducanh2912/next-pwa** | 10 | installable web app, service worker |
| Native shell | **Capacitor** | 7.x | wraps static export → Android APK (see [setup](SETUP-android-apk.md)) |
| PDF | **pdf-lib** | 1.17 | branded invoice PDF (portal can't export PDF) |
| QR | **qrcode** | 1.5 | LHDN validation QR on the PDF |
| AI SDK | **Vercel AI SDK** / **openai** | - | Gemini for vision, DeepSeek for text; OpenAI-compatible fetch for BYO providers |

## AI / LLM

- Multi-provider: **Gemini, DeepSeek, Anthropic, OpenAI-compatible** - key
  rotation + fallback in [src/services/ai/](../src/services/ai/) (`llmClient`,
  `extractionService`, `mappingService`, `askService`).
- **BYO keys planned** - future feature for users to supply their own provider keys via UI; currently built-in keys active, user key management UI greyed out (Coming Soon)
- RAG chat over IRBM/LHDN knowledge ([irbm-knowledge.json](../src/data/irbm-knowledge.json)),
  see [rag-design.md](rag-design.md).

## Data & compliance

- **UBL 2.1** schema-valid JSON output; scope/compliance logic in
  [src/services/compliance/](../src/services/compliance/) (`scopeEngine`).
- **MyInvois / LHDN** submission ([submissionService](../src/services/invoice/submissionService.ts)),
  per-user MyInvois credentials (BYO, on-device).
- **Google Drive** optional backup/sync ([src/services/drive/](../src/services/drive/),
  `syncRepository` + `DriveSyncButton`) - pushes invoices to the user's own Drive.

## i18n

- EN / MS / ZH (`rojak` dropped 2026-06-20). Source [strings.csv](../src/data/i18n/strings.csv)
  → runtime [strings.json](../src/data/i18n/strings.json) (the JSON is
  authoritative at runtime); access via `useT()` / `translate()`.

## Tooling

| Concern | Tool |
|---------|------|
| Tests | **Vitest** 3 + Testing Library + `jsdom` + `fake-indexeddb` |
| Lint | **ESLint** 9 + `eslint-config-next` |
| Build (web) | `next build` → Vercel |
| Build (APK) | `BUILD_TARGET=apk next build` → `out/` → Capacitor → Gradle |
| Design system | custom Tailwind tokens; bundle script `scripts/ds-bundle.mjs` |

## Two build targets (same repo)

- **Web (Vercel):** full SSR - marketing, guide (dynamic), API routes.
- **APK (Capacitor):** `output: 'export'` static build via `scripts/build-apk.bat`, runs client-only on device with embedded Node.js server.
