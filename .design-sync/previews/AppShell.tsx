import { AppShell, PageHeader, InvoiceList } from 'senanginvoice'
import { mockInvoices } from '../fixtures/invoice'

const noop = () => {}
const refresh = async () => {}

// AppShell is the app chrome (TopBar + BottomNav + Fab). Composed here as a full
// invoice-list screen so the design agent sees a complete layout, not just a frame.
export const InvoiceListScreen = () => (
  <div style={{ width: 440, height: 720, overflow: 'hidden', borderRadius: 16 }}>
    <AppShell>
      <PageHeader title="Invoices" subtitle="3 this month" />
      <InvoiceList invoices={mockInvoices} loading={false} onCreateClick={noop} tab="active" onRefresh={refresh} />
    </AppShell>
  </div>
)
