# Senang Invoice — design system conventions

A React component library from a Malaysian e-invoicing app (MyInvois). Mobile-first,
accessible (focus rings, `aria-*`, 44–48px touch targets), styled entirely with
Tailwind utility classes. Import every component from `window.SenangInvoice.*`.

Groups: **common** (Button, Input, Select, Spinner, Modal, EmptyState, ConfirmDialog),
**layout** (AppShell, TopBar, BottomNav, PageHeader, Fab), **common nav** (LangToggle),
**invoice** (StatusPill, QrBadge, SearchBar, DateFilter, BulkActionBar, InvoiceCard,
InvoiceList), **dashboard** (StatTile), **review/tables** (ExtractedItemsTable,
LineItemEditor).

## Setup — no provider needed

Components are self-styling: the compiled Tailwind stylesheet ships in the bundle and
is reachable from `styles.css` (`@import "./_ds_bundle.css"`), and brand tokens are
compiled into `_ds_bundle.css` as `var(--color-*)` custom properties. There is **no theme
or i18n provider to mount** — render any component directly; i18n falls back to its
default language. The brand font is **Inter** (`font-sans` → `var(--font-inter)`).

`AppShell` is the app frame (TopBar + BottomNav + Fab around `children`) — wrap a page's
content in it for a full screen; render the smaller components standalone.

## Styling idiom — Tailwind utilities with this brand's theme

No CSS-in-JS, no class maps to import — style with Tailwind utility classes. Use the
brand scales below (all ship in `_ds_bundle.css`); the same values are also exposed as
`var(--color-teal-700)` … custom properties in `_ds_bundle.css`.

| Concern | Use | Notes |
|---|---|---|
| Brand / primary | `teal-50`–`teal-900` | `teal-700` = primary action; `teal-800/900` hover/active; `teal-100/50` tints |
| Success | `success-50/100/600/700/800` | validated / positive (e.g. StatusPill validated) |
| Warning | `warning-50/100/600/700/800` | caution |
| Danger / destructive | `danger-50/100/600/700/800` (or `red-500`–`red-800`) | errors, destructive confirm |
| Neutrals / text | `gray-50`–`gray-900`, `white`, `black/50` (overlays) | `text-gray-900` headings, `text-gray-500/600` secondary |
| Type | `font-sans`, `text-sm`/`text-base`/`text-lg`/`text-2xl`, `font-medium`/`font-semibold`/`font-bold` | base body is `text-sm` |
| Radius | `rounded-lg` (controls), `rounded-2xl` (cards/dialogs), `rounded-full` (pills/toggles) | |
| Elevation | `shadow-cta` (brand CTA), `shadow-xl` (modals), `shadow-lg` (bars) | |
| Focus | `focus:ring-2 focus:ring-teal-700` (inputs), `focus:ring-teal-500 focus:ring-offset-2` (buttons) | always keep a visible focus ring |

## Component API quick reference

- `Button` — `variant` `'primary'|'secondary'|'outline'|'ghost'`, `size` `'sm'|'md'|'lg'`, `loading`. 48px min height.
- `Input` / `Select` — `label`, `error`, `helperText`; `Select` takes `options: {value,label}[]` (not children).
- `StatusPill` — `status` `'draft'|'validated'|'synced'` (gray / green / teal).
- `InvoiceCard` — `invoice` object + `tab`; `InvoiceList` — `invoices[]`, `loading`, `onCreateClick`.
- `StatTile` — `label`, `value`, `icon`. `PageHeader` — `title`, `subtitle`, `action`.
- `SearchBar` / `DateFilter` / `BulkActionBar` — controlled (value + change handlers).
- `Modal` / `ConfirmDialog` — controlled overlays: `open`, `onClose`/`onConfirm`+`onCancel`.
- `TopBar` / `BottomNav` / `Fab` / `LangToggle` — app chrome; mostly prop-less.
- `ExtractedItemsTable` / `LineItemEditor` — review tables driven by the invoice store.

Full contracts are in each `components/<group>/<Name>/<Name>.d.ts`; read those and the
`tokens/` + `_ds_bundle.css` files before styling.

## Idiomatic example

```tsx
const { AppShell, PageHeader, InvoiceList } = window.SenangInvoice

function InvoicesScreen({ invoices, onCreate }) {
  return (
    <AppShell>
      <PageHeader title="Invoices" subtitle={`${invoices.length} this month`} />
      <InvoiceList invoices={invoices} loading={false} onCreateClick={onCreate} tab="active" />
    </AppShell>
  )
}
```
