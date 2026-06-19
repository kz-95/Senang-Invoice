import type { Invoice } from '@/lib/types'
import { pushToDrive, listDriveInvoices, trashDriveFile } from '@/services/drive/driveSyncService'
import { getOrRefreshToken } from '@/services/drive/driveAuth'
import { invoiceRepository } from './invoiceRepository'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

async function downloadDriveFile(fileId: string): Promise<string> {
  const token = await getOrRefreshToken()
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to download file ${fileId}: ${res.status}`)
  return res.text()
}

export const syncRepository = {
  async pushToDrive(invoice: Invoice): Promise<{ fileId: string; syncedAt: string }> {
    // Ensure we update the existing Drive file in place when one is known.
    const current = await invoiceRepository.getById(invoice.id)
    const existingFileId = current?.sync?.driveFileId ?? invoice.sync?.driveFileId
    const toPush: Invoice = existingFileId
      ? { ...invoice, sync: { ...(invoice.sync ?? {}), driveFileId: existingFileId } }
      : invoice
    const result = await pushToDrive(toPush)
    const syncedAt = new Date().toISOString()
    // Re-read AFTER the network round-trip so concurrent edits made during the
    // await (metadata edits, a delete, localModifiedAt) are preserved. Merge
    // only the sync.* bookkeeping keys onto the freshest record.
    const fresh = await invoiceRepository.getById(invoice.id)
    if (fresh) {
      fresh.sync = {
        ...(fresh.sync ?? {}),
        driveFileId: result.fileId,
        driveSyncedAt: syncedAt,
      }
      await invoiceRepository.save(fresh)
    }
    return { fileId: result.fileId, syncedAt }
  },

  async deleteFromDrive(invoice: Invoice): Promise<void> {
    const fileId = invoice.sync?.driveFileId
    if (!fileId) return
    await trashDriveFile(fileId)
    const inv = await invoiceRepository.getById(invoice.id)
    if (inv) {
      inv.sync = { ...(inv.sync ?? {}), driveFileId: undefined }
      await invoiceRepository.save(inv)
    }
  },

  async pullFromDrive(fileId: string): Promise<Invoice> {
    const json = await downloadDriveFile(fileId)
    return JSON.parse(json) as Invoice
  },

  async pullAllFromDrive(): Promise<Invoice[]> {
    try {
      const token = await getOrRefreshToken()
      const files = await listDriveInvoices(token)
      const invoices: Invoice[] = []
      for (const file of files) {
        try {
          const inv = await this.pullFromDrive(file.id)
          const now = new Date().toISOString()
          const existing = await invoiceRepository.getById(inv.id)
          if (!existing) {
            inv.sync = { ...(inv.sync ?? {}), driveFileId: file.id, driveFetchedAt: now }
            await invoiceRepository.save(inv)
          } else {
            const existingMod = existing.sync?.localModifiedAt
            if (existingMod && existingMod > (existing.sync?.driveSyncedAt ?? '')) {
              continue
            }
            existing.sync = { ...(existing.sync ?? {}), driveFileId: file.id, driveFetchedAt: now }
            await invoiceRepository.save(existing)
          }
          invoices.push(inv)
        } catch {
          // skip corrupted files
        }
      }
      return invoices
    } catch {
      return []
    }
  },

  async syncAll(): Promise<{ pushed: number; pulled: number; conflicts: string[] }> {
    let pushed = 0
    let pulled = 0
    const conflicts: string[] = []

    const all = await invoiceRepository.getAll()
    for (const inv of all) {
      if (inv.deletedAt) {
        // Propagate soft-deletes: trash the remote file if it still exists.
        if (inv.sync?.driveFileId) {
          try {
            await this.deleteFromDrive(inv)
          } catch {
            conflicts.push(inv.id)
          }
        }
        continue
      }
      // Push only when the invoice has never reached Drive (neither pushed nor
      // pulled) or has local edits newer than its last sync. An invoice that was
      // pulled from Drive (has driveFetchedAt) is already the remote truth and
      // must not be PATCHed back every sync.
      const s = inv.sync
      const lastSync = s?.driveSyncedAt ?? s?.driveFetchedAt
      const neverReachedDrive = !lastSync
      const locallyModified = !!(s?.localModifiedAt && s.localModifiedAt > (lastSync ?? ''))
      if (neverReachedDrive || locallyModified) {
        try {
          await this.pushToDrive(inv)
          pushed++
        } catch {
          conflicts.push(inv.id)
        }
      }
    }

    try {
      const pulledInvoices = await this.pullAllFromDrive()
      pulled = pulledInvoices.length
    } catch {
      // pull failed
    }

    return { pushed, pulled, conflicts }
  },

  async detectConflicts(): Promise<Invoice[]> {
    const all = await invoiceRepository.getAll()
    return all.filter(inv =>
      inv.sync?.localModifiedAt && inv.sync?.driveSyncedAt &&
      inv.sync.localModifiedAt > inv.sync.driveSyncedAt
    )
  },

  getSyncStatus(invoice: Invoice): 'synced' | 'modified' | 'never-backed-up' | 'conflict' {
    if (!invoice.sync?.driveSyncedAt) return 'never-backed-up'
    if (invoice.sync.localModifiedAt && invoice.sync.localModifiedAt > invoice.sync.driveSyncedAt) return 'modified'
    return 'synced'
  },
}
