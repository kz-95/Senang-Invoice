# Issues & Limitations

Last updated: 2026-06-21

## Unresolved Issues

### 1. Google Drive Sync Not Working in APK

**Symptom**: `getAccessToken()` / `signOutGoogle()` calls fail silently or throw in the Capacitor WebView. The OAuth popup either doesn't open or loses context.

**Attempted**:
- Used Google Identity Services (`@react-oauth/google`) with popup-based OAuth flow
- Used Capacitor Browser plugin to open OAuth URL in external browser — redirect back to app fails because Android WebView doesn't receive custom scheme redirects reliably
- Tried `window.open()` for OAuth popup — blocked by WebView popup blocker
- Tried redirect flow with `capacitor://` custom scheme — not consistently received on Xiaomi WebView

**Suggested approaches**:
1. **Capacitor Google Auth plugin** (`@codetrix-studio/capacitor-google-auth`) — native Android Google Sign-In, no browser OAuth needed. Returns tokens directly to the app.
2. **Service worker + BroadcastChannel**: open OAuth in Chrome Custom Tab, have a service worker intercept the redirect and post back via BroadcastChannel.
3. **Feature gate**: hide Drive sync section in settings when running in Capacitor (detect via `Capacitor.isNativePlatform()`), show "Coming Soon" until native auth is implemented.

---

### 2. ~~OCR Extraction Fails in APK~~ → FIXED

**Symptom**: When user captures a receipt photo and taps "Scan", the extraction either:
- Returns 429 (rate limit) from the LLM API
- Times out because `capacitor-nodejs` bridge fails to make the HTTP request
- Returns empty items

**Root causes**:
- The LLM API key is a shared hardcoded key; hitting rate limits when multiple users/devices use it
- `capacitor-nodejs` runs a Node.js process inside the APK to proxy API calls. On Xiaomi WebView, this bridge can be slow or fail entirely
- The extraction flow: image base64 → POST /api/extract → LLM → parse items. If any step fails, nothing is returned

**Attempted**:
- Added retry logic in `llmClient.ts` with up to 6 retries and key rotation
- Used hardcoded fallback key when no user keys exist
- Degraded path in `extractionService.ts` returns raw text when no LLM available
- Pre-warmed the Node.js bridge on app start in `NodeProvider`

**Suggested approaches**:
1. **Client-side OCR fallback**: Use Tesseract.js (WASM-based, runs in browser) as backup when server extraction fails. Slower but works offline.
2. **Local queue + retry**: Queue failed extractions in IndexedDB, retry with exponential backoff when network recovers.
3. **429 handling**: Implement proper cooldown tracking per key in `llmClient.ts`. When all keys are rate-limited, queue the request and retry after shortest cooldown expires.
4. **Multi-model fallback**: Try Anthropic first, fall back to Gemini, then DeepSeek. Each model has separate rate limits.
5. **WebView bridge diagnostic**: Log `capacitor-nodejs` health on app start. If bridge is dead, show a diagnostic banner.

---

### 3. ~~Voice/Mic Permission Unreliable on Xiaomi WebView~~ → FIXED

**Symptom**: Microphone permission request fails or `SpeechRecognition` returns `not-allowed` even when OS permission is granted. User needs to manually enable mic in Android Settings → Apps → Senang Inv → Permissions.

**Root cause**: Xiaomi MIUI enforces stricter WebView permissions than stock Android. The browser `getUserMedia({ audio: true })` API doesn't always trigger the OS permission dialog in Capacitor WebView.

**Attempted**:
- Used `getUserMedia({ audio: true })` before `SpeechRecognition` to force permission prompt
- Added explicit Xiaomi-targeted error messages with instructions to enable in Settings
- Installed `capacitor-voice-recorder` native plugin (v7.0.6) for reliable permission handling
- Changed VoiceCapture to use `VoiceRecorder.hasAudioRecordingPermission()` + `VoiceRecorder.requestAudioRecordingPermission()` before SpeechRecognition

**Suggested approaches**:
1. **Native recording fallback**: Record audio via `capacitor-voice-recorder`, send the audio file to a Speech-to-Text API (Google Cloud STT, Deepgram, or Whisper) instead of relying on browser `SpeechRecognition`.
2. **Permission diagnostic on app start**: Check mic permission on app launch, show a prominent banner if denied with a "Open Settings" button that deep-links to the app's Android settings page.
3. **Auto-retry**: If SpeechRecognition fails, wait 2s and retry up to 3 times. Sometimes the permission takes a moment to propagate in WebView.

---

### 4. No Fallback Chain for 429 Rate Limits

**Symptom**: When the primary LLM key returns 429, the extraction/chat simply fails. There is no fallback to alternative keys/models.

**Root cause**: The `callWithRetry()` function in `llmClient.ts` retries the SAME key up to 6 times with delay, but doesn't try alternative keys or models. The key rotation only happens when the initial `getLlamaClient()` call detects a cooldown.

**Attempted**:
- `getLlamaClient()` checks per-key cooldown and skips rate-limited keys
- Added key priority ordering with fallback flag
- API routes accept `x-llm-key`, `x-llm-model`, `x-llm-provider`, `x-llm-base-url` headers for client-provided keys

**Suggested approaches**:
1. **Multi-key failover chain**: In `callWithRetry()`, maintain a list of (key, model) pairs. Try key 1 → model A. If 429, try key 1 → model B (different model may have separate rate limit). If still 429, try key 2 → model A, etc. Track per-key per-model cooldown timestamps.
2. **Queue + delayed retry**: When ALL keys are rate-limited, push the request to a local queue (IndexedDB). Retry when the earliest cooldown expires. Show the user a "Processing will resume shortly" indicator.
3. **Provider rotation**: The hardcoded fallback key is Anthropic-only. Add fallback keys for Gemini and DeepSeek as well so the system can rotate providers.
4. **Request batching**: For extraction, batch multiple images/transcripts into a single LLM call instead of calling per-item.

---

### 5. Next.js Prefetches Marketing Pages Causing Memory Spikes

**Symptom**: In dev mode (`npm run dev`), Next.js prefetches the `/about`, `/support`, and `/guide/*` pages, causing ~1GB memory spikes. This happens because Next.js `<Link>` components trigger prefetch on hover/viewport entry.

**Attempted**:
- None yet

**Suggested approaches**:
1. **Disable prefetch on marketing Links**: Add `prefetch={false}` to all `<Link>` components on the marketing pages and in the navigation.
2. **Route segment config**: In the marketing layout, add `export const prefetch = false` to prevent automatic prefetching.
3. **Dynamic imports**: Use `next/dynamic` to lazy-load the heavy marketing page components so they're not bundled in the main chunk.
4. **Separate dev server for marketing**: Serve marketing pages from a separate Next.js instance in dev, keeping the main app lightweight.

---

### 6. IndexedDB Hangs on Xiaomi WebView (Intermittent)

**Symptom**: Occasionally the app freezes on startup because IndexedDB (Dexie.js) blocks the main thread. The landing page boot check was previously causing this by doing an async DB read during render.

**Root cause**: Xiaomi WebView's IndexedDB implementation can stall indefinitely when opening/reading the database, especially after the app has been backgrounded and resumed.

**Attempted**:
- Removed `ProfileGate` wrapper from `(app)/layout.tsx` — async DB check was blocking all child rendering
- Added 3s timeout + `.catch()` fallback on landing page boot check
- Reverted to simple `LandingGate` that checks `localStorage` only (no IndexedDB)
- `NumberPresetManager` now has fallback `useEffect` to load from DB if Zustand store is empty

**Suggested approaches**:
1. **Web Worker for DB**: Run Dexie in a Web Worker so IndexedDB operations never block the main thread.
2. **Dexie timeout wrapper**: Add a global 5s timeout to all Dexie operations with a degraded fallback (empty data, retry later).
3. **Startup sequence**: Move all DB reads to a splash screen phase. Don't render any data-dependent components until DB is confirmed ready.
4. **LocalStorage mirror**: Keep a mirror of critical profile data in localStorage as a fast-read cache. Fall back to localStorage if IndexedDB times out.

---

### 7. Bottom Nav Content Overlap on Some Pages

**Symptom**: On pages like Settings and Dashboard, content can scroll behind the fixed BottomNav bar, making the last items inaccessible.

**Root cause**: The `<main>` container has `paddingBottom: calc(96px + env(safe-area-inset-bottom, 0px))` but some pages use `-mb-4` or other negative margins that reduce the effective padding.

**Attempted**:
- Set main padding to `calc(96px + env(safe-area-inset-bottom, 0px))`
- Removed `pb-20` class in favor of inline style padding
- Create page uses `pb-8` on top of main's padding
- Ask page ChatWindow form has extra `paddingBottom: calc(12px + safe-area)`

**Suggested approaches**:
1. **Remove all per-page bottom padding** — rely exclusively on main's `paddingBottom` for clearance.
2. **Add a `<SafeBottom />` spacer component** at the bottom of every page.
3. **CSS custom property**: Set `--safe-bottom` as a CSS variable on `:root` and have all pages use `padding-bottom: var(--safe-bottom)`.

---

## Resolved Issues

| Issue | Resolution |
|-------|-----------|
| APK build fragility (file locks) | `xcopy`+`rmdir` with retry in `build-apk.bat` |
| ProfileGate causing Xiaomi app freeze | Removed entirely — boot check at `/` only |
| Create page toolbox floating mid-screen | Pinned `shrink-0` at bottom of flex column; clickable chevron toggle |
| LLM key manager exposing key management UI | Greyed out with "Coming Soon" badge; hardcoded key active |
| RAG retriever leaking wrong chunks on single-word queries | `MIN_SCORE=2` threshold + `KEEP_SHORT` token preservation |
| Missing app icon sizes (192, 512, 32) | Generated from `icon-1024.png` using sharp |
| `next dev` fails after APK build | Auto-clean `.next/` and `out/` in Step 5 of build script |
| Unicode/emoji in UI | Replaced all `▶▸▾★•⚠✕` with inline SVG icons |
| Seed data not auto-loading | `DemoBanner` auto-seeds on first load when no data exists |
| Demo invoices indistinguishable | "Example" badge on all `demo-inv-*` invoices |
| Numbering settings not opening in APK | `NumberPresetManager` added fallback DB load via `useEffect` |
| Ask page title too high | Changed `-my-4` to `-mb-4`; added `px-4` to title row |
| PIN gate on Advanced/ERP setup | Removed — Advanced now opens MyInvoisCredsManager directly |
| Dashboard only 3 tabs | Expanded to 5: Pending, Validated, Synced, Archived, Trash |
| OCR extraction fails in APK | ✅ Fixed — installed `@capacitor/camera` native plugin for photo capture |
| Voice/mic permission on Xiaomi | ✅ Fixed — installed `@capacitor-community/speech-recognition` for native STT, `capacitor-voice-recorder` for permission |
