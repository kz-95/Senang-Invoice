import { db } from './db'
import type { Invoice } from '@/lib/types'

const TRASH_DAYS = 30

export const invoiceRepository = {
  async save(invoice: Invoice): Promise<void> {
    await db.invoices.put(invoice)
  },
  async getAll(): Promise<Invoice[]> {
    return db.invoices.orderBy('createdAt').reverse().toArray()
  },
  async getById(id: string): Promise<Invoice | undefined> {
    return db.invoices.get(id)
  },
  async remove(id: string): Promise<void> {
    await db.invoices.delete(id)
  },
  async clearAll(): Promise<void> {
    await db.invoices.clear()
  },

  async archive(id: string): Promise<void> {
    const inv = await db.invoices.get(id)
    if (!inv) return
    inv.archived = true
    inv.archivedAt = new Date().toISOString()
    await db.invoices.put(inv)
  },

  async unarchive(id: string): Promise<void> {
    const inv = await db.invoices.get(id)
    if (!inv) return
    inv.archived = false
    inv.archivedAt = undefined
    await db.invoices.put(inv)
  },

  async softDelete(id: string): Promise<void> {
    const inv = await db.invoices.get(id)
    if (!inv) return
    inv.deletedAt = new Date().toISOString()
    await db.invoices.put(inv)
  },

  async restoreFromTrash(id: string): Promise<void> {
    const inv = await db.invoices.get(id)
    if (!inv) return
    inv.deletedAt = undefined
    await db.invoices.put(inv)
  },

  async hardDelete(id: string): Promise<void> {
    await db.invoices.delete(id)
  },

  async purgeExpired(): Promise<string[]> {
    const cutoff = new Date(Date.now() - TRASH_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const all = await db.invoices.toArray()
    const expired = all.filter(inv => inv.deletedAt && inv.deletedAt < cutoff)
    const ids = expired.map(inv => inv.id)
    await db.invoices.bulkDelete(ids)
    return ids
  },

  async updateMetadata(
    id: string,
    fields: Partial<Pick<Invoice, 'notes' | 'discount' | 'payment' | 'supplierRef' | 'buyer'>>
  ): Promise<void> {
    const inv = await db.invoices.get(id)
    if (!inv) return

    const editedFields: string[] = inv.editedFields ?? []

    if (fields.notes !== undefined && fields.notes !== inv.notes) {
      inv.notes = fields.notes
      if (!editedFields.includes('notes')) editedFields.push('notes')
    }
    if (fields.discount !== undefined) {
      inv.discount = fields.discount
      if (!editedFields.includes('discount')) editedFields.push('discount')
    }
    if (fields.payment !== undefined) {
      inv.payment = fields.payment
      if (!editedFields.includes('payment')) editedFields.push('payment')
    }
    if (fields.supplierRef !== undefined && fields.supplierRef !== inv.supplierRef) {
      inv.supplierRef = fields.supplierRef
      if (!editedFields.includes('supplierRef')) editedFields.push('supplierRef')
    }
    if (fields.buyer !== undefined) {
      inv.buyer = fields.buyer
      if (!editedFields.includes('buyer')) editedFields.push('buyer')
    }

    inv.editedAt = new Date().toISOString()
    inv.editedFields = editedFields
    await db.invoices.put(inv)
  },

  async getByStatus(options: { archived?: boolean; trashed?: boolean }): Promise<Invoice[]> {
    const all = await db.invoices.toArray()

    if (options.trashed) {
      return all.filter(inv => !!inv.deletedAt)
    }
    if (options.archived) {
      return all.filter(inv => inv.archived && !inv.deletedAt)
    }
    return all.filter(inv => !inv.archived && !inv.deletedAt)
  },

  async bulkArchive(ids: string[]): Promise<void> {
    const now = new Date().toISOString()
    const invoices = await db.invoices.bulkGet(ids)
    for (const inv of invoices) {
      if (inv) {
        inv.archived = true
        inv.archivedAt = now
      }
    }
    await db.invoices.bulkPut(invoices.filter(Boolean) as Invoice[])
  },

  async bulkDelete(ids: string[]): Promise<void> {
    const now = new Date().toISOString()
    const invoices = await db.invoices.bulkGet(ids)
    for (const inv of invoices) {
      if (inv) {
        inv.deletedAt = now
      }
    }
    await db.invoices.bulkPut(invoices.filter(Boolean) as Invoice[])
  },

  async bulkRestore(ids: string[]): Promise<void> {
    const invoices = await db.invoices.bulkGet(ids)
    for (const inv of invoices) {
      if (inv) {
        inv.deletedAt = undefined
      }
    }
    await db.invoices.bulkPut(invoices.filter(Boolean) as Invoice[])
  },

  async bulkUnarchive(ids: string[]): Promise<void> {
    const invoices = await db.invoices.bulkGet(ids)
    for (const inv of invoices) {
      if (inv) {
        inv.archived = false
        inv.archivedAt = undefined
      }
    }
    await db.invoices.bulkPut(invoices.filter(Boolean) as Invoice[])
  },
}
