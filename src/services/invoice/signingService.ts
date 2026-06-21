import { createHash } from 'crypto'
import { create as createXml } from 'xmlbuilder2'
import { SignedXml } from 'xml-crypto'
import { readFileSync } from 'fs'

export interface SigningConfig {
  mode: 'sandbox' | 'production'
  certPath?: string
  keyPath?: string
  passphrase?: string
}

export interface SignedDocument {
  document: string
  documentHash: string
  signature: string
  certificate: string
  format: 'JSON' | 'XML'
}

const CBC_FIELDS = new Set([
  'ID', 'IssueDate', 'IssueTime', 'InvoiceTypeCode', 'DocumentCurrencyCode',
  'TaxCurrencyCode', 'Note', 'LineExtensionAmount', 'TaxExclusiveAmount',
  'TaxInclusiveAmount', 'PayableAmount', 'AllowanceTotalAmount',
  'ChargeIndicator', 'Amount', 'AllowanceChargeReason', 'InvoicedQuantity',
  'Line', 'PaymentMeansCode', 'PaymentDueDate', 'RegistrationName',
  'CityName', 'PostalZone', 'CountrySubentityCode', 'IdentificationCode',
  'Telephone', 'ElectronicMail', 'IndustryClassificationCode',
  'ItemClassificationCode', 'Description', 'TaxAmount', 'TaxableAmount',
  'Percent', 'TaxExemptionReason', 'PriceAmount',
])

const CAC_FIELDS = new Set([
  'InvoiceLine', 'AccountingSupplierParty', 'AccountingCustomerParty',
  'TaxTotal', 'LegalMonetaryTotal', 'AllowanceCharge',
  'PaymentMeans', 'PaymentTerms', 'AdditionalDocumentReference',
  'Party', 'PartyIdentification', 'PostalAddress', 'Country',
  'AddressLine', 'PartyLegalEntity', 'Contact', 'TaxSubtotal',
  'TaxCategory', 'TaxScheme', 'Item', 'CommodityClassification',
  'Price', 'ItemPriceExtension', 'InvoiceDocumentReference',
  'BillingReference',
])

function isCbcField(name: string): boolean {
  if (CBC_FIELDS.has(name)) return true
  if (CAC_FIELDS.has(name)) return false
  return !name[0] || name[0] === name[0].toUpperCase() && name.length < 30
}

function jsonToXmlNode(doc: ReturnType<typeof createXml>, parent: any, key: string, value: unknown): void {
  if (value === null || value === undefined) return

  if (key === '_' || key === '') {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      parent.txt(String(value))
    }
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const obj = item as Record<string, unknown>
        if ('_' in obj) {
          const textVal = obj._
          const attrs: Record<string, string> = {}
          for (const [k, v] of Object.entries(obj)) {
            if (k !== '_' && typeof v === 'string') attrs[k] = v
          }
          const ns = isCbcField(key) ? 'cbc' : 'cac'
          const el = parent.ele(null, key)
          el.att(attrs)
          if (textVal !== undefined && textVal !== null) {
            el.txt(String(textVal))
          }
          el.up()
        } else {
          const ns = isCbcField(key) ? 'cbc' : 'cac'
          const el = parent.ele(null, key)
          for (const [childKey, childVal] of Object.entries(obj)) {
            jsonToXmlNode(doc, el, childKey, childVal)
          }
          el.up()
        }
      } else if (item && typeof item === 'object') {
        const ns = isCbcField(key) ? 'cbc' : 'cac'
        const el = parent.ele(null, key)
        for (const [childKey, childVal] of Object.entries(item as Record<string, unknown>)) {
          jsonToXmlNode(doc, el, childKey, childVal)
        }
        el.up()
      } else {
        const ns = isCbcField(key) ? 'cbc' : 'cac'
        parent.ele(null, key).txt(String(item)).up()
      }
    }
    return
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('_' in obj) {
      const textVal = obj._
      const attrs: Record<string, string> = {}
      for (const [k, v] of Object.entries(obj)) {
        if (k !== '_' && typeof v === 'string') attrs[k] = v
      }
      const ns = isCbcField(key) ? 'cbc' : 'cac'
      const el = parent.ele(null, key)
      el.att(attrs)
      if (textVal !== undefined && textVal !== null) {
        el.txt(String(textVal))
      }
      el.up()
    } else {
      const ns = isCbcField(key) ? 'cbc' : 'cac'
      const el = parent.ele(null, key)
      for (const [childKey, childVal] of Object.entries(obj)) {
        jsonToXmlNode(doc, el, childKey, childVal)
      }
      el.up()
    }
    return
  }

  const ns = isCbcField(key) ? 'cbc' : 'cac'
  parent.ele(null, key).txt(String(value)).up()
}

function ublJsonToXml(ublJson: Record<string, unknown>): string {
  const invNs = ublJson._D as string
  const cacNs = ublJson._A as string
  const cbcNs = ublJson._B as string

  const doc = createXml({ version: '1.0', encoding: 'UTF-8' })
  const root = doc.ele('Invoice', {
    xmlns: invNs,
    'xmlns:cac': cacNs,
    'xmlns:cbc': cbcNs,
  })

  const invoices = ublJson.Invoice
  if (Array.isArray(invoices)) {
    for (const inv of invoices) {
      if (inv && typeof inv === 'object') {
        for (const [key, val] of Object.entries(inv as Record<string, unknown>)) {
          jsonToXmlNode(doc, root, key, val)
        }
      }
    }
  }

  return doc.end({ prettyPrint: false })
}

async function signXades(
  canonicalXml: string,
  config: SigningConfig
): Promise<{ signature: string; certificate: string }> {
  if (!config.certPath || !config.keyPath) {
    throw new Error('Certificate or key path not configured for production signing')
  }

  const cert = readFileSync(config.certPath, 'utf8')
  const key = readFileSync(config.keyPath, 'utf8')

  const sig = new SignedXml({ privateKey: key, publicCert: cert })
  sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256'
  sig.canonicalizationAlgorithm = 'http://www.w3.org/2001/10/xml-exc-c14n#'

  sig.addReference({
    xpath: '//*',
    transforms: ['http://www.w3.org/2001/10/xml-exc-c14n#'],
    digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
  })

  sig.computeSignature(canonicalXml)

  return {
    signature: sig.getSignatureXml(),
    certificate: cert,
  }
}

export function createSigningService(config: SigningConfig) {
  return {
    async sign(ublJson: Record<string, unknown>): Promise<SignedDocument> {
      if (config.mode === 'sandbox') {
        const minified = JSON.stringify(ublJson)
        return {
          document: Buffer.from(minified, 'utf8').toString('base64'),
          documentHash: createHash('sha256').update(minified, 'utf8').digest('base64'),
          signature: '',
          certificate: '',
          format: 'JSON',
        }
      }

      const xmlDoc = ublJsonToXml(ublJson)
      const { signature, certificate } = await signXades(xmlDoc, config)

      const signedXml = signature
        ? xmlDoc.replace('</Invoice>', `${signature}</Invoice>`)
        : xmlDoc

      return {
        document: Buffer.from(signedXml, 'utf8').toString('base64'),
        documentHash: createHash('sha256').update(signedXml, 'utf8').digest('base64'),
        signature: Buffer.from(signature, 'utf8').toString('base64'),
        certificate: Buffer.from(certificate, 'utf8').toString('base64'),
        format: 'XML',
      }
    },
  }
}

export { ublJsonToXml }

export type SigningService = ReturnType<typeof createSigningService>
