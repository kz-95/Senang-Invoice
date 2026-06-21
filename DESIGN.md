# SenangInvoice - Design System Brief

Paste or reference this when prompting **claude.ai/design** so generated UI matches the product. SenangInvoice is a **mobile-first Malaysian e-invoice app** (Next.js 15 + Tailwind + Capacitor → Android APK) with a **desktop marketing/landing** surface. Both must read as one product.

> **Light mode only** for now. Design dark tokens but don't ship them.

---

## 1. Brand tokens (source of truth)

### Color
- **Primary - teal.** `teal-700 #0f766e` (base), `teal-800 #115e59` (hover), `teal-900 #134e4a` (active/headings). Surfaces/tints: `teal-50 #f0fdfa`, `teal-100 #ccfbf1`.
- **Neutrals.** Text `gray-900`; body `gray-600`; secondary `gray-500`; borders `gray-100`/`gray-200`; app background `gray-50`.
- **Semantic (named tokens - use these, not raw green/amber/red):**
  - `success` → 50 `#f0fdf4`, 100 `#dcfce7`, 600 `#16a34a`, 700 `#15803d`, 800 `#166534` (validated / confirmed)
  - `warning` → 50 `#fffbeb`, 100 `#fef3c7`, 600 `#d97706`, 700 `#b45309`, 800 `#92400e` (modified / caution)
  - `danger`  → 50 `#fef2f2`, 100 `#fee2e2`, 600 `#dc2626`, 700 `#b91c1c`, 800 `#991b1b` (destructive)
- **No off-palette colors.** No blue, purple, etc. "Synced/submitted" states use **teal**, not blue.

### Typography
- **Inter** (self-hosted), weights 400 / 500 / 600 / 700.
- Headings `font-bold` `text-gray-900` (or `text-teal-900` on tinted/onboarding surfaces). Body `text-gray-600`. Labels `font-medium`/`font-semibold`.
- **RM amounts use `tabular-nums`** so digits align.

### Radius
- **Controls** (buttons, inputs, tabs, chips, segmented switchers): `rounded-lg`.
- **Cards, modals, CTAs, big tiles:** `rounded-2xl`.
- Pills/avatars/dots: `rounded-full`. Avoid `rounded-xl` / `rounded-3xl` (off-scale).

### Elevation (one scale)
- Cards: `shadow-sm`. Hover lift: `shadow-md`. Modals: `shadow-xl`. Hero + phone mockup: `shadow-2xl`.
- Brand-tinted CTA elevation: **`shadow-cta`** = `0 10px 25px -5px rgb(15 118 110 / 0.25)`. Don't hand-roll colored shadows.

### Spacing & icons
- 4 / 8px rhythm (`gap-2`, `p-4`, `py-2.5`, etc.).
- Icons: **Heroicons outline, stroke 1.5**, one family. **No emoji as icons.** All icons are inline SVG (zero icon-lib deps).

---

## 2. Tailwind class vocabulary (what the agent should actually type)

This is a **custom Tailwind** setup - no shadcn/ui, no component lib. Style with utility classes + the tokens above.

| Intent | Classes |
|---|---|
| Primary button | `rounded-lg bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900` |
| Secondary button | `rounded-lg bg-teal-100 text-teal-800 hover:bg-teal-200` |
| Outline button | `rounded-lg border border-teal-300 text-teal-700 hover:bg-teal-50` |
| Ghost button | `rounded-lg text-teal-700 hover:bg-teal-50` |
| Card | `rounded-2xl bg-white p-4 shadow-sm` (+ `border border-gray-200` on marketing) |
| Input | `rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700` |
| Status pill | `inline-block px-3 py-1 rounded-full text-xs font-semibold` + semantic bg/text |
| Hero / footer CTA | `rounded-2xl bg-teal-700 px-12 py-7 text-xl font-semibold text-white shadow-cta` |
| Focus ring (all interactive) | `focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2` |

Semantic usage: `bg-success-100 text-success-800`, `bg-warning-100 text-warning-800`, `bg-danger-600 text-white`, etc.

---

## 3. Components & surfaces

**Mobile app (primary).**
- **TopBar** - `bg-teal-700 text-white`, `h-14`, icon buttons `rounded-full hover:bg-white/10`.
- **BottomNav** - fixed bottom, `bg-white border-t border-gray-200`, items ≥ 48px, active = `text-teal-700 font-semibold`, inactive = `text-gray-500`.
- **Invoice card** - `rounded-2xl bg-white p-4 shadow-sm`; amount `text-teal-700 tabular-nums`; action buttons ≥ 44px, `rounded-lg`.
- **StatusPill** - `draft` = `bg-gray-100 text-gray-700`; `validated` = `bg-success-100 text-success-800`; `synced` = `bg-teal-100 text-teal-800`.
- **Capture** (camera / voice / manual) - segmented switcher `rounded-lg bg-gray-100 p-1`; preview frames `rounded-2xl`.
- **Ask/chat, settings, profile** - white cards, teal accents, consistent inputs.

**Welcome flow (mobile first-run, routed).** 3 full-screen steps, each its own URL: `/welcome/1` (welcome), `/welcome/2` (scope), `/welcome/3` (login - Google Drive connect). Each step is deep-linkable (`#welcome-{n}` section id) so other surfaces can link straight to a step (e.g. guide → `/welcome/3`). `/` redirects mobile visitors here (`LandingGate`): not-onboarded → `/welcome/1`, onboarded → `/dashboard`. Big icon tile `rounded-2xl bg-teal-50 text-teal-700 h-20 w-20`; heading `text-3xl font-bold text-teal-900`; progress dots are `<Link>`s (active `w-6 bg-teal-600`, idle `w-2 bg-gray-300`); **Skip** top-right; full-width primary CTA bottom; swipe + Back/Next navigate between routes. Safe-area aware (`env(safe-area-inset-*)`). Component: `WelcomeFlow`.

**Desktop landing (app-download-first).** Hero: "Download the App Now!" + single **Download Now** CTA (`rounded-2xl`, `shadow-cta`) that opens `DownloadModal` - a chooser listing **Google Play Store** (recommended) and **Standalone APK**; unavailable options render disabled with a "coming soon" sub-label. "Malaysian E-Invoice Made Simple", feature pills (`rounded-full bg-white shadow-sm ring-1 ring-gray-100`), phone mockup (invoice + QR + RM totals). Then **PainVsEase** (gray card vs teal card, both `rounded-2xl`), **TrustRow** (3 feature cards), **GuideTeaser** (4 article cards, `rounded-2xl`, hover `hover:border-teal-300 hover:shadow-md`), **CtaFooter** (`bg-teal-700`, white CTA).

---

## 4. Rules to enforce

- **WCAG AA:** text contrast ≥ 4.5:1; visible focus rings; touch targets ≥ 44px (≥ 48px primary).
- **Motion:** respect `prefers-reduced-motion`; animations 150–300ms; **transform/opacity only**.
- **Tokens, not raw hex** in components. **`tabular-nums`** for all RM amounts.
- **No new deps** - custom Button + Tailwind only (no framer-motion, lucide, shadcn).
- **i18n:** every user-facing string via `t()` in **EN / MS / ZH**. MyInvois / LHDN are proper nouns - keep verbatim.
- **No emoji icons**; Heroicons outline only.

---

## 5. One idiomatic snippet

```tsx
// Invoice summary card - mobile
<div className="rounded-2xl bg-white p-4 shadow-sm">
  <div className="flex items-center justify-between">
    <span className="text-sm font-semibold text-gray-900">{t('invoice.number')}</span>
    <span className="inline-block rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-800">
      {t('invoice.statusValidated')}
    </span>
  </div>
  <p className="mt-2 text-2xl font-bold text-teal-700 tabular-nums">RM 1,325.00</p>
  <button className="mt-3 min-h-[48px] w-full rounded-lg bg-teal-700 px-4 text-white font-medium hover:bg-teal-800 active:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
    {t('invoice.generate')}
  </button>
</div>
```

---

## 6. Pages & contact

**Support page** (`/support`): Displays guide article cards in a grid (from `src/data/guide/guide.json`, fully i18n'd EN/MS/ZH via `pickLoc()` helper). Includes non-LLM ScopeCheckCard for e-invoicing eligibility checks - requires no AI keys, returns catalog fallback.

**About page** (`/about`): Mission statement + privacy policy + Formspree contact form. Form posts to new dynamic endpoint `src/app/api/contact/route.ts` which forwards to Formspree. Contact email (`NEXT_PUBLIC_CONTACT_EMAIL`) is single-language env value, not i18n key (set once per deployment).

**Download gates:** the desktop Hero "Download Now" button opens `DownloadModal`; inside, the Play Store row is disabled when `PLAYSTORE_COMING_SOON` is true (or `PLAYSTORE_URL` empty) and the APK row is disabled when `APK_DOWNLOAD_URL` is empty - each shows a "coming soon" sub-label instead of a broken link.

**Guide CTA, device-aware (server-side).** The end-of-guide CTA (last article, `!nextMeta`) is chosen on the server from the `User-Agent` (`isMobileUserAgent` in `src/lib/device.ts`, read via `headers()` in the guide route): **mobile** → teal `Log In to Continue` link to `/welcome/3`; **desktop** → the disabled "Download Now" button. Reading `headers()` makes the guide route render dynamically (opts out of static generation).

**Environment:** `SENANG_FORMSPREE_ENDPOINT` (server-side, routes only), `NEXT_PUBLIC_CONTACT_EMAIL` (public display). Both live in `.env.local`, not i18n strings.
