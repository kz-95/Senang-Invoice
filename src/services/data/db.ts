import Dexie, { type Table } from 'dexie'
import type { Invoice, SellerProfile } from '@/lib/types'

export interface SettingsRow { key: string; value: any }

export interface LlmKeyRow {
  id: string
  label: string
  provider: string
  apiKey: string
  model: string
  baseUrl?: string
  isActive: boolean
  isFallback: boolean
  priority: number
  createdAt: string
}

export interface MyInvoisCredsRow { id: string; label: string; clientId: string; clientSecret: string; updatedAt: string }

export interface SubmissionQueueRow {
  id: string
  invoiceId: string
  ubl: object
  codeNumber: string
  attempts: number
  maxAttempts: number
  lastAttemptAt: string
  createdAt: string
  status: 'queued' | 'failed'
  lastError?: string
}

export class SenangInvoiceDb extends Dexie {
  invoices!: Table<Invoice, string>
  pdfs!: Table<{ id: string; blob: Blob }, string>
  settings!: Table<SettingsRow, string>
  llmKeys!: Table<LlmKeyRow, string>
  myInvoisCreds!: Table<MyInvoisCredsRow, string>
  submissionQueue!: Table<SubmissionQueueRow, string>

  constructor() {
    super('SenangInvoiceDb')

    this.version(1).stores({
      invoices: 'id, status, createdAt',
      pdfs: 'id',
      settings: 'key',
    })

    this.version(2).stores({
      invoices: 'id, status, createdAt',
      pdfs: 'id',
      settings: 'key',
      llmKeys: 'id, isActive, priority',
    })

    this.version(3).stores({
      invoices: 'id, status, createdAt',
      pdfs: 'id',
      settings: 'key',
      llmKeys: 'id, isActive, priority',
      myInvoisCreds: 'id',
    })

    this.version(4).stores({
      invoices: 'id, status, createdAt, archived, deletedAt',
      pdfs: 'id',
      settings: 'key',
      llmKeys: 'id, isActive, priority',
      myInvoisCreds: 'id',
    })

    this.version(5).stores({
      invoices: 'id, status, createdAt, archived, deletedAt',
      pdfs: 'id',
      settings: 'key',
      llmKeys: 'id, isActive, priority',
      myInvoisCreds: 'id',
      submissionQueue: 'id, invoiceId, status',
    })
  }
}

let _initFailed = false

// Export safely — if IndexedDB is blocked by WebView/MIUI, return a safe stub
export const db = (() => {
  try {
    return new SenangInvoiceDb()
  } catch (e) {
    console.error('[db] IndexedDB blocked — running without persistence:', e)
    _initFailed = true
    // Return a stub where all table accesses return safe no-op objects
    return new Proxy({} as SenangInvoiceDb, {
      get() {
        // Every property access (e.g., db.invoices, db.settings) returns a
        // safe proxy whose methods return resolved empty promises.
        return new Proxy({}, {
          get(_, method) {
            if (method === 'then') return undefined
            // Methods that return data: resolve with empty result
            const m = String(method)
            if (m === 'count') return () => Promise.resolve(0)
            if (m === 'get' || m === 'toArray' || m === 'bulkGet') return () => Promise.resolve([])
            // All other methods (put, delete, clear, bulkPut, etc.) → resolved void
            return () => Promise.resolve()
          }
        })
      }
    }) as unknown as SenangInvoiceDb
  }
})()

// Expose so other code can check if db is functional
export function isDbAvailable(): boolean { return !_initFailed }
