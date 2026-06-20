import { InvoiceCard } from 'senanginvoice'
import { makeInvoice } from '../fixtures/invoice'

export const Validated = () => <InvoiceCard invoice={makeInvoice()} tab="active" />
export const Synced = () => <InvoiceCard invoice={makeInvoice({ status: 'synced', number: 'INV-2026-0041' })} tab="active" />
export const Draft = () => <InvoiceCard invoice={makeInvoice({ status: 'draft', number: 'INV-2026-0040', buyer: { type: 'general' } })} tab="active" />
