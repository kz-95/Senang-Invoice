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

export class SenangInvoiceDb extends Dexie {
  invoices!: Table<Invoice, string>
  pdfs!: Table<{ id: string; blob: Blob }, string>
  settings!: Table<SettingsRow, string>
  llmKeys!: Table<LlmKeyRow, string>
  myInvoisCreds!: Table<MyInvoisCredsRow, string>

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
  }
}

export const db = new SenangInvoiceDb()
