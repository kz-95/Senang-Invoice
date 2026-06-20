import { InvoiceList } from 'senanginvoice'
import { mockInvoices } from '../fixtures/invoice'

const noop = () => {}
const refresh = async () => {}

export const WithInvoices = () => (
  <div style={{ width: 440 }}>
    <InvoiceList invoices={mockInvoices} loading={false} onCreateClick={noop} tab="active" onRefresh={refresh} />
  </div>
)

export const Loading = () => (
  <div style={{ width: 440 }}>
    <InvoiceList invoices={[]} loading onCreateClick={noop} tab="active" onRefresh={refresh} />
  </div>
)

export const Empty = () => (
  <div style={{ width: 440 }}>
    <InvoiceList invoices={[]} loading={false} onCreateClick={noop} tab="active" onRefresh={refresh} />
  </div>
)
