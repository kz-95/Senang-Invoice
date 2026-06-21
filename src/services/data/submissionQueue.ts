import { db, type SubmissionQueueRow } from './db'
import { safeRandomUUID } from '@/lib/crypto'

export const submissionQueueRepository = {
  async enqueue(invoiceId: string, ubl: object, codeNumber: string): Promise<void> {
    const row: SubmissionQueueRow = {
      id: safeRandomUUID(),
      invoiceId,
      ubl,
      codeNumber,
      attempts: 0,
      maxAttempts: 5,
      lastAttemptAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'queued',
    }
    await db.submissionQueue.put(row)
  },

  async getPending(): Promise<SubmissionQueueRow[]> {
    return db.submissionQueue.where('status').equals('queued').toArray()
  },

  async markAttempted(id: string, error?: string): Promise<void> {
    const row = await db.submissionQueue.get(id)
    if (!row) return
    const attempts = row.attempts + 1
    const status: SubmissionQueueRow['status'] = attempts >= row.maxAttempts ? 'failed' : 'queued'
    await db.submissionQueue.put({
      ...row,
      attempts,
      status,
      lastAttemptAt: new Date().toISOString(),
      lastError: error,
    })
  },

  async remove(id: string): Promise<void> {
    await db.submissionQueue.delete(id)
  },

  async removeByInvoiceId(invoiceId: string): Promise<void> {
    const rows = await db.submissionQueue.where('invoiceId').equals(invoiceId).toArray()
    for (const row of rows) {
      await db.submissionQueue.delete(row.id)
    }
  },

  async getFailed(): Promise<SubmissionQueueRow[]> {
    return db.submissionQueue.where('status').equals('failed').toArray()
  },

  async clearCompleted(): Promise<void> {
    await db.submissionQueue.where('status').equals('queued').delete()
  },
}
