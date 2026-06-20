import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { Invoice } from '@/lib/types'
import { APP_NAME } from '@/lib/constants'
import { toQrDataUrl } from './qrService'

const TEAL = rgb(0.059, 0.463, 0.431) // #0f766e

export async function renderInvoicePdf(invoice: Invoice, qrDataUrl: string): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  let y = height - 40

  // Header
  page.drawText(APP_NAME, { x: 40, y, font: bold, size: 20, color: TEAL })
  y -= 16
  page.drawText('E-Invoice', { x: 40, y, font: regular, size: 11, color: rgb(0.4, 0.4, 0.4) })
  y -= 24

  // Divider
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: TEAL })
  y -= 16

  // Seller block
  const s = invoice.seller
  page.drawText('Seller', { x: 40, y, font: bold, size: 10, color: TEAL })
  y -= 13
  for (const line of [s.businessName, `TIN: ${s.tin}`, s.address, s.phone, s.email]) {
    page.drawText(line || '', { x: 40, y, font: regular, size: 9, color: rgb(0.1, 0.1, 0.1) })
    y -= 12
  }
  y -= 8

  // Buyer block
  page.drawText('Buyer', { x: 40, y, font: bold, size: 10, color: TEAL })
  y -= 13
  if (invoice.buyer.type === 'general') {
    page.drawText('General Public', { x: 40, y, font: regular, size: 9, color: rgb(0.1, 0.1, 0.1) })
  } else {
    page.drawText(`${invoice.buyer.name}  TIN: ${invoice.buyer.tin}`, { x: 40, y, font: regular, size: 9, color: rgb(0.1, 0.1, 0.1) })
  }
  y -= 20

  // Line items table header
  page.drawText('Description', { x: 40, y, font: bold, size: 9, color: TEAL })
  page.drawText('Qty', { x: 260, y, font: bold, size: 9, color: TEAL })
  page.drawText('UOM', { x: 300, y, font: bold, size: 9, color: TEAL })
  page.drawText('Unit Price', { x: 350, y, font: bold, size: 9, color: TEAL })
  page.drawText('Amount', { x: 450, y, font: bold, size: 9, color: TEAL })
  y -= 12

  // Lines
  for (const line of invoice.lines) {
    page.drawText(line.description.slice(0, 30), { x: 40, y, font: regular, size: 8 })
    page.drawText(String(line.qty), { x: 260, y, font: regular, size: 8 })
    page.drawText(line.uom, { x: 300, y, font: regular, size: 8 })
    page.drawText(line.unitPrice.toFixed(2), { x: 350, y, font: regular, size: 8 })
    page.drawText(line.amount.toFixed(2), { x: 450, y, font: regular, size: 8 })
    y -= 12
  }
  y -= 8

  // Totals
  const { subtotal, taxTotal, total } = invoice.totals
  page.drawText(`Subtotal: RM ${subtotal.toFixed(2)}`, { x: 350, y, font: regular, size: 9 })
  y -= 12
  page.drawText(`Tax: RM ${taxTotal.toFixed(2)}`, { x: 350, y, font: regular, size: 9 })
  y -= 12
  page.drawText(`Total: RM ${total.toFixed(2)}`, { x: 350, y, font: bold, size: 10, color: TEAL })
  y -= 24

  // QR image
  try {
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '')
    const pngBytes = Buffer.from(base64Data, 'base64')
    const qrImage = await pdfDoc.embedPng(pngBytes)
    page.drawImage(qrImage, { x: 40, y: y - 80, width: 80, height: 80 })
  } catch {
    // QR embed failed - skip silently
  }
  y -= 90

  // Footer: validation UUID
  if (invoice.validation?.uuid) {
    page.drawText(`UUID: ${invoice.validation.uuid}`, { x: 40, y, font: regular, size: 7, color: rgb(0.5, 0.5, 0.5) })
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
}

/**
 * Render an invoice PDF on demand and trigger a browser download.
 * PDFs are no longer rendered/stored at finalize — this is the single
 * generation path, invoked when the user actually wants the file.
 */
export async function downloadInvoicePdf(invoice: Invoice, fileName?: string): Promise<void> {
  const qrDataUrl = invoice.validation?.qrLink ? await toQrDataUrl(invoice.validation.qrLink) : ''
  const blob = await renderInvoicePdf(invoice, qrDataUrl)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName ?? `invoice-${invoice.number || invoice.id.slice(0, 8)}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Defer revoke: a.click() schedules the download asynchronously; revoking the
  // blob URL in the same tick can abort the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
