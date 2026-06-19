import type { Invoice, Buyer, LineItem } from '@/lib/types'

/**
 * Bukku batch invoice CSV exporter.
 *
 * Senang is a fast data-capture front-door; Bukku is the accounting system of
 * record. This maps captured invoices into Bukku's batch-import CSV so the user
 * can upload them without re-keying. No Bukku credentials required.
 *
 * ⚠️ HEADER NAMES ARE PROVISIONAL. Bukku's exact column headers (Simple vs
 * Extended template) must be confirmed against a real template downloaded from
 * Bukku → Sales → Invoices → Import. The documented pattern is honoured here
 * (order-independent headers; line items as ItemName{N}/ItemCode{N}/ItemPrice{N};
 * max 25 line items per row). When the real template arrives, correct ONLY the
 * constants below — the mapping logic does not need to change.
 *
 * See ignorethis/2026-06-19-bukku-csv-export.md and ignorethis/bukku-export-spec.md.
 */

export const BUKKU_MAX_LINE_ITEMS = 25

// TODO(bukku-template): confirm exact header strings against a real Bukku template.
const HEADER_FIELDS = {
  invoiceNo: 'InvoiceNo',
  invoiceDate: 'InvoiceDate', // TODO confirm Bukku date format (likely DD/MM/YYYY)
  customerName: 'CustomerName',
  customerTin: 'CustomerTIN',
  customerRegNo: 'CustomerRegNo',
  subtotal: 'Subtotal',
  taxTotal: 'TaxTotal',
  total: 'Total',
  remarks: 'Remarks',
} as const

// TODO(bukku-template): confirm per-line column names (qty/uom/classification).
const LINE_FIELDS = {
  name: (n: number) => `ItemName${n}`,
  code: (n: number) => `ItemCode${n}`,
  qty: (n: number) => `ItemQty${n}`,
  uom: (n: number) => `ItemUom${n}`,
  price: (n: number) => `ItemPrice${n}`,
} as const

function buyerName(buyer: Buyer): string {
  return buyer.type === 'tin' ? buyer.name : 'General Public'
}

function buyerTin(buyer: Buyer): string {
  return buyer.type === 'tin' ? buyer.tin : ''
}

function buyerRegNo(buyer: Buyer): string {
  return buyer.type === 'tin' ? buyer.idValue : ''
}

function isoDate(iso: string): string {
  // Emit the date portion (YYYY-MM-DD). TODO(bukku-template): reformat if Bukku
  // requires DD/MM/YYYY.
  return (iso || '').slice(0, 10)
}

/** RFC 4180 field escaping. */
function escapeCsv(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildHeaderRow(maxLines: number): string[] {
  const headers: string[] = [
    HEADER_FIELDS.invoiceNo,
    HEADER_FIELDS.invoiceDate,
    HEADER_FIELDS.customerName,
    HEADER_FIELDS.customerTin,
    HEADER_FIELDS.customerRegNo,
    HEADER_FIELDS.subtotal,
    HEADER_FIELDS.taxTotal,
    HEADER_FIELDS.total,
    HEADER_FIELDS.remarks,
  ]
  for (let i = 1; i <= maxLines; i++) {
    headers.push(LINE_FIELDS.name(i), LINE_FIELDS.code(i), LINE_FIELDS.qty(i), LINE_FIELDS.uom(i), LINE_FIELDS.price(i))
  }
  return headers
}

function buildInvoiceRow(invoice: Invoice, maxLines: number): string[] {
  const row: string[] = [
    invoice.number,
    isoDate(invoice.createdAt),
    buyerName(invoice.buyer),
    buyerTin(invoice.buyer),
    buyerRegNo(invoice.buyer),
    invoice.totals.subtotal.toFixed(2),
    invoice.totals.taxTotal.toFixed(2),
    invoice.totals.total.toFixed(2),
    invoice.notes ?? '',
  ]
  for (let i = 0; i < maxLines; i++) {
    const line: LineItem | undefined = invoice.lines[i]
    row.push(
      line?.description ?? '',
      line?.classificationCode ?? '',
      line ? String(line.qty) : '',
      line?.uom ?? '',
      line ? line.unitPrice.toFixed(2) : ''
    )
  }
  return row
}

/**
 * Convert invoices to a Bukku batch-import CSV string (one row per invoice).
 * Line items beyond BUKKU_MAX_LINE_ITEMS are dropped — callers should split such
 * invoices; this is logged rather than silently truncated.
 */
export function invoicesToBukkuCsv(invoices: Invoice[]): string {
  // Width is fixed at the documented Bukku max so every row aligns to the header.
  const maxLines = BUKKU_MAX_LINE_ITEMS

  const overflow = invoices.filter(inv => inv.lines.length > maxLines)
  if (overflow.length > 0) {
    console.warn(
      `[bukkuCsvExporter] ${overflow.length} invoice(s) exceed ${maxLines} line items; ` +
        `extra lines were dropped: ${overflow.map(i => i.number).join(', ')}`
    )
  }

  const rows: string[][] = [buildHeaderRow(maxLines)]
  for (const invoice of invoices) {
    rows.push(buildInvoiceRow(invoice, maxLines))
  }

  return rows.map(cols => cols.map(escapeCsv).join(',')).join('\r\n') + '\r\n'
}
