// Explicit bundle entry for design-sync. Re-exports the synced components via
// relative paths so esbuild follows their import graph. App-only coupling that
// would crash the standalone bundle is handled at build time:
//   - next/link, next/navigation  → stubbed via .design-sync/tsconfig.bundle.json
//   - i18n / stores (zustand)      → provider-less, render with defaults
//   - process.env.NODE_ENV         → defined by the bundler
// Components that read live data (Dexie) render empty unless their preview seeds
// the relevant store; their previews do so.

// Must be first: defines process.env before any app module reads env vars at load.
import './stubs/shim-process'

// common
export { Button } from '../src/components/common/Button'
export { Input } from '../src/components/common/Input'
export { Select } from '../src/components/common/Select'
export { Spinner } from '../src/components/common/Spinner'
export { Modal } from '../src/components/common/Modal'
export { EmptyState } from '../src/components/common/EmptyState'
export { ConfirmDialog } from '../src/components/common/ConfirmDialog'
export { LangToggle } from '../src/components/common/LangToggle'

// layout / navigation
export { AppShell } from '../src/components/layout/AppShell'
export { TopBar } from '../src/components/layout/TopBar'
export { BottomNav } from '../src/components/layout/BottomNav'
export { PageHeader } from '../src/components/layout/PageHeader'
export { Fab } from '../src/components/layout/Fab'

// dashboard
export { StatTile } from '../src/components/dashboard/StatTile'

// invoice
export { StatusPill } from '../src/components/invoice/StatusPill'
export { QrBadge } from '../src/components/invoice/QrBadge'
export { SearchBar } from '../src/components/invoice/SearchBar'
export { DateFilter } from '../src/components/invoice/DateFilter'
export { BulkActionBar } from '../src/components/invoice/BulkActionBar'
export { InvoiceCard } from '../src/components/invoice/InvoiceCard'
export { InvoiceList } from '../src/components/invoice/InvoiceList'

// review / tables
export { ExtractedItemsTable } from '../src/components/review/ExtractedItemsTable'
export { LineItemEditor } from '../src/components/review/LineItemEditor'

// Store exported on the global so previews can seed the SAME bundled instance
// the table/editor components read from (a source-imported copy would be a
// different singleton and wouldn't affect the rendered component). Not a
// PascalCase export → not treated as a component, just rides on window.SenangInvoice.
export { useInvoiceStore } from '../src/stores/invoiceStore'
