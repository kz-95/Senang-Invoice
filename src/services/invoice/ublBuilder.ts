import type { SellerProfile, Buyer, LineItem, InvoiceTotals } from '@/lib/types'
import { GENERAL_TIN } from '@/lib/constants'

interface BuildUblArgs {
  seller: SellerProfile; buyer: Buyer; lines: LineItem[];
  issuedAt: string;
  invoiceNumber?: string;
  discount?: { amount: number; reason?: string };
  payment?: { method?: string; terms?: string; dueDate?: string };
  supplierRef?: string;
  notes?: string;
}
interface BuildUblResult { ubl: object; totals: InvoiceTotals }

// MyInvois array-wrap helpers
const w = (value: unknown, attrs: Record<string, unknown> = {}) => [{ _: value, ...attrs }]
const money = (value: number) => [{ _: Number(value.toFixed(2)), currencyID: 'MYR' }]

export function buildUbl({ seller, buyer, lines, issuedAt, invoiceNumber, discount, payment, supplierRef, notes }: BuildUblArgs): BuildUblResult {
  const subtotal = lines.reduce((s, l) => s + l.amount, 0)
  const taxTotal = lines.reduce((s, l) => s + l.taxAmount, 0)
  const total = subtotal + taxTotal

  const discountAmount = discount ? discount.amount : 0
  const lineTotal = subtotal - discountAmount
  const payableAmount = lineTotal + taxTotal

  const taxCategories = new Map<string, { amount: number; taxAmount: number; rate: number }>()
  for (const line of lines) {
    const type = line.taxType || '06'
    if (!taxCategories.has(type)) {
      taxCategories.set(type, { amount: 0, taxAmount: 0, rate: line.taxRate ?? 0 })
    }
    const cat = taxCategories.get(type)!
    cat.amount += line.amount
    cat.taxAmount += line.taxAmount
  }

  const totals: InvoiceTotals = { subtotal, taxTotal, total: payableAmount }

  const d = new Date(issuedAt)
  const issueDate = d.toISOString().slice(0, 10)
  const issueTime = d.toISOString().slice(11, 19) + 'Z'

  const invoice: Record<string, unknown> = {
    ID: w(invoiceNumber ?? `INV-${d.getTime()}`),
    IssueDate: w(issueDate),
    IssueTime: w(issueTime),
    InvoiceTypeCode: [{ _: '01', listVersionID: '1.0' }],
    DocumentCurrencyCode: w('MYR'),
    TaxCurrencyCode: w('MYR'),
    // Optional fields
  }

  if (discount) {
    invoice.AllowanceCharge = [{
      ChargeIndicator: w(false),
      Amount: money(discount.amount),
      AllowanceChargeReason: discount.reason ? w(discount.reason) : undefined,
    }]
  }
  if (payment?.method) {
    const paymentMeans: Record<string, unknown> = { PaymentMeansCode: w(payment.method) }
    if (payment.dueDate) {
      paymentMeans.PaymentDueDate = w(payment.dueDate)
    }
    invoice.PaymentMeans = [paymentMeans]
  }
  if (payment?.terms) {
    invoice.PaymentTerms = [{ Note: w(payment.terms) }]
  }
  if (supplierRef) {
    invoice.AdditionalDocumentReference = [{ ID: w(supplierRef) }]
  }
  if (notes) {
    invoice.Note = w(notes)
  }

  // placeholders assembled in later tasks via Object.assign(invoice, {...})
  assembleParties(invoice, seller, buyer)
  assembleLinesAndTotals(invoice, lines, subtotal, taxTotal, lineTotal, payableAmount, discountAmount, taxCategories)

  const ubl = {
    _D: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    _A: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    _B: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    Invoice: [invoice],
  }
  return { ubl, totals }
}

function party(opts: {
  tin: string; brn: string; sst: string; name: string;
  msic?: string; msicName?: string;
  city: string; postal: string; state: string; country: string;
  addressLines: string[]; phone: string; email: string;
}) {
  const ident = [
    { ID: w(opts.tin, { schemeID: 'TIN' }) },
    { ID: w(opts.brn, { schemeID: 'BRN' }) },
    { ID: w(opts.sst, { schemeID: 'SST' }) },
    { ID: w('NA', { schemeID: 'TTX' }) },
  ]
  const p: Record<string, unknown> = {
    PartyIdentification: ident,
    PostalAddress: [{
      CityName: w(opts.city),
      PostalZone: w(opts.postal),
      CountrySubentityCode: w(opts.state),
      AddressLine: opts.addressLines.map((line) => ({ Line: w(line) })),
      Country: [{ IdentificationCode: [{ _: opts.country, listID: 'ISO3166-1', listAgencyID: '6' }] }],
    }],
    PartyLegalEntity: [{ RegistrationName: w(opts.name) }],
    Contact: [{ Telephone: w(opts.phone), ElectronicMail: w(opts.email) }],
  }
  if (opts.msic) {
    p.IndustryClassificationCode = [{ _: opts.msic, name: opts.msicName ?? '' }]
  }
  return { Party: [p] }
}

function assembleParties(invoice: Record<string, unknown>, seller: SellerProfile, buyer: Buyer): void {
  invoice.AccountingSupplierParty = [party({
    tin: seller.tin, brn: 'NA', sst: seller.sstReg || 'NA', name: seller.businessName,
    msic: seller.msicCode, msicName: '',
    city: seller.city ?? 'Kuala Lumpur', postal: seller.postalZone ?? '50000', state: seller.stateCode ?? '14', country: 'MYS',
    addressLines: [seller.address], phone: seller.phone || 'NA', email: seller.email || 'NA',
  })]

  if (buyer.type === 'general') {
    invoice.AccountingCustomerParty = [party({
      tin: GENERAL_TIN, brn: 'NA', sst: 'NA', name: "Consolidated Buyer's",
      city: '', postal: '', state: '', country: '',
      addressLines: ['NA', '', ''], phone: 'NA', email: 'NA',
    })]
  } else {
    invoice.AccountingCustomerParty = [party({
      tin: buyer.tin, brn: buyer.idType === 'BRN' ? buyer.idValue : 'NA', sst: 'NA', name: buyer.name,
      city: buyer.city ?? 'Kuala Lumpur', postal: buyer.postalZone ?? '50000', state: buyer.stateCode ?? '14', country: 'MYS',
      addressLines: [buyer.address ?? 'NA'], phone: 'NA', email: 'NA',
    })]
  }
}

const TAX_SCHEME = [{ ID: [{ _: 'OTH', schemeID: 'UN/ECE 5153', schemeAgencyID: '6' }] }]

function assembleLinesAndTotals(
  invoice: Record<string, unknown>, lines: LineItem[],
  subtotal: number, taxTotal: number, lineTotal: number, payableAmount: number,
  discountAmount: number, taxCategories: Map<string, { amount: number; taxAmount: number; rate: number }>
): void {
  invoice.InvoiceLine = lines.map((line, idx) => {
    const taxCategory: Record<string, unknown> = {
      ID: w(line.taxType || '06'),
      TaxScheme: TAX_SCHEME,
    }
    if ((line.taxType || '06') === 'E') {
      taxCategory.TaxExemptionReason = w('Exempt')
    }
    return {
      ID: w(String(idx + 1)),
      InvoicedQuantity: [{ _: line.qty, unitCode: line.uom || 'C62' }],
      LineExtensionAmount: money(line.amount),
      TaxTotal: [{
        TaxAmount: money(line.taxAmount),
        TaxSubtotal: [{
          TaxableAmount: money(line.amount),
          TaxAmount: money(line.taxAmount),
          Percent: w(line.taxRate ?? 0),
          TaxCategory: [taxCategory],
        }],
      }],
      Item: [{
        CommodityClassification: [
          { ItemClassificationCode: [{ _: line.classificationCode || '003', listID: 'CLASS' }] },
        ],
        Description: w(line.description),
      }],
      Price: [{ PriceAmount: money(line.unitPrice) }],
      ItemPriceExtension: [{ Amount: money(line.amount) }],
    }
  })

  invoice.TaxTotal = [{
    TaxAmount: money(taxTotal),
    TaxSubtotal: Array.from(taxCategories.entries()).map(([type, cat]) => ({
      TaxableAmount: money(cat.amount),
      TaxAmount: money(cat.taxAmount),
      TaxCategory: [{
        ID: w(type),
        TaxScheme: TAX_SCHEME,
        ...(type === 'E' ? { TaxExemptionReason: w('Exempt') } : {}),
      }],
    })),
  }]

  invoice.LegalMonetaryTotal = [{
    LineExtensionAmount: money(subtotal),
    TaxExclusiveAmount: money(lineTotal),
    TaxInclusiveAmount: money(payableAmount),
    PayableAmount: money(payableAmount),
  }]
  if (discountAmount) {
    const lmt = invoice.LegalMonetaryTotal as Record<string, unknown>[]
    lmt[0].AllowanceTotalAmount = money(discountAmount)
  }
}

export const __ublHelpers = { w, money }
