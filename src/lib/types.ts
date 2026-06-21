export type Lang = 'ms' | 'zh' | 'en'
export type InvoiceStatus = 'draft' | 'validated' | 'synced'

export type DocType = '01'

export interface NumberPreset {
  id: string
  name: string
  pattern: string
  customTokens: Record<string, {
    label: string
    default?: string
  }>
  reset: 'never' | 'yearly' | 'monthly'
  nextSeq: number
  lastResetPeriod?: string
  isDefault?: boolean
}

export interface SellerProfile {
  id: string; businessName: string; tin: string; sstReg: string;
  msicCode: string; address: string; phone: string; email: string;
  numberingPresets: NumberPreset[];
  city?: string; postalZone?: string; stateCode?: string;
}
export type Buyer =
  | { type: 'general' }
  | { type: 'tin'; tin: string; name: string; idType: 'BRN'|'NRIC'|'PASSPORT'; idValue: string; address?: string; city?: string; postalZone?: string; stateCode?: string; }
export interface LineItem {
  description: string; qty: number; uom: string; unitPrice: number;
  amount: number; classificationCode: string; taxType: string; taxAmount: number;
  taxRate?: number
  confidence?: number
}
export interface InvoiceTotals { subtotal: number; taxTotal: number; total: number }
export type SubmissionStatus = 'mock' | 'valid' | 'invalid' | 'pending'
export interface ValidationResult {
  uuid: string; longId: string; qrLink: string; validatedAt: string;
  status: SubmissionStatus;
  submissionUid?: string;
  rejections?: string[];
  error?: string;
}
export interface Invoice {
  id: string; number: string; docType: DocType;
  createdAt: string; status: InvoiceStatus;
  seller: SellerProfile; buyer: Buyer; lines: LineItem[]; totals: InvoiceTotals;
  discount?: { amount: number; reason?: string };
  payment?: { method?: string; terms?: string; dueDate?: string };
  supplierRef?: string;
  notes?: string;
  ubl: unknown; validation?: ValidationResult; pdfBlobId?: Blob;
  submissionUid?: string;
  archived: boolean;
  archivedAt?: string;
  deletedAt?: string;
  editedAt?: string;
  editedFields?: string[];
  numberConfigUsed?: {
    presetId: string
    pattern: string
    tokenValues: Record<string, string>
    generatedNumber: string
  }
  sync?: {
    driveFileId?: string
    driveSyncedAt?: string
    driveFetchedAt?: string
    localModifiedAt?: string
  }
}
export interface AskMessage { id: string; role: 'user'|'assistant'; text: string; lang: Lang; createdAt: string }
