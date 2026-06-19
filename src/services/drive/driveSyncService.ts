import type { Invoice } from '@/lib/types'
import { getOrRefreshToken } from './driveAuth'
import { settingsRepository } from '../data/settingsRepository'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'
const FOLDER_NAME = 'Senang Invoice'
const FOLDER_ID_KEY = 'drive_folder_id'

export interface DriveSyncResult {
  fileId: string
  webViewLink?: string
}

class DriveError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'DriveError'
  }
}

function isNotFound(err: unknown): boolean {
  return err instanceof DriveError && err.status === 404
}

/** Escape a value for use inside a Drive `q` single-quoted string literal. */
function escapeDriveQuery(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/**
 * Push an invoice's JSON to Drive.
 * - If the invoice already has `sync.driveFileId`, the existing file is updated
 *   in place (PATCH) — no duplicate file is created. If that file was removed
 *   remotely (404), we fall back to creating a fresh one.
 * - Otherwise a new file is created (POST) inside the app folder.
 *
 * PDFs are intentionally NOT synced; JSON is the source of truth and PDFs are
 * generated on demand (see pdfService.downloadInvoicePdf).
 */
export async function pushToDrive(invoice: Invoice): Promise<DriveSyncResult> {
  const token = await getOrRefreshToken()

  const jsonContent = JSON.stringify(invoice, null, 2)
  const invoiceFileName = `invoice-${invoice.id.slice(0, 8)}.json`
  const blob = new Blob([jsonContent], { type: 'application/json' })

  const existingId = invoice.sync?.driveFileId
  if (existingId) {
    try {
      const updatedId = await updateFile(token, existingId, invoiceFileName, blob, 'application/json')
      return { fileId: updatedId }
    } catch (err) {
      // Remote file gone (trashed/deleted elsewhere) — create a fresh one rather
      // than retrying forever against a dead id.
      if (!isNotFound(err)) throw err
    }
  }

  const createdId = await createInAppFolder(token, invoiceFileName, blob, 'application/json')
  return { fileId: createdId }
}

function multipartBody(metadata: Record<string, unknown>, blob: Blob): FormData {
  const formData = new FormData()
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  formData.append('file', blob)
  return formData
}

async function createInAppFolder(
  token: string,
  fileName: string,
  blob: Blob,
  mimeType: string
): Promise<string> {
  let folderId = await findOrCreateFolder(token, FOLDER_NAME)
  try {
    return await createFile(token, folderId, fileName, blob, mimeType)
  } catch (err) {
    if (!isNotFound(err)) throw err
    // Cached folder was removed in Drive — clear the cache, re-resolve, retry once.
    await settingsRepository.set(FOLDER_ID_KEY, null)
    folderId = await findOrCreateFolder(token, FOLDER_NAME)
    return await createFile(token, folderId, fileName, blob, mimeType)
  }
}

async function createFile(
  token: string,
  folderId: string,
  fileName: string,
  blob: Blob,
  mimeType: string
): Promise<string> {
  const body = multipartBody({ name: fileName, mimeType, parents: [folderId] }, blob)

  const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new DriveError(`Drive upload failed (${res.status}): ${err}`, res.status)
  }

  const data = (await res.json()) as { id: string }
  return data.id
}

async function updateFile(
  token: string,
  fileId: string,
  fileName: string,
  blob: Blob,
  mimeType: string
): Promise<string> {
  // PATCH updates the existing file content in place. No `parents` on update.
  const body = multipartBody({ name: fileName, mimeType }, blob)

  const res = await fetch(`${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=multipart`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new DriveError(`Drive update failed (${res.status}): ${err}`, res.status)
  }

  const data = (await res.json()) as { id: string }
  return data.id
}

/**
 * Move a Drive file to trash (recoverable). Used to propagate soft-deletes.
 */
export async function trashDriveFile(fileId: string): Promise<void> {
  const token = await getOrRefreshToken()
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trashed: true }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new DriveError(`Drive trash failed (${res.status}): ${err}`, res.status)
  }
}

async function findOrCreateFolder(token: string, folderName: string): Promise<string> {
  const cached = await settingsRepository.get<string>(FOLDER_ID_KEY)
  if (cached) return cached

  const q = `name='${escapeDriveQuery(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const searchRes = await fetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (searchRes.ok) {
    const searchData = (await searchRes.json()) as { files?: Array<{ id: string }> }
    if (searchData.files && searchData.files.length > 0) {
      const id = searchData.files[0].id
      await settingsRepository.set(FOLDER_ID_KEY, id)
      return id
    }
  }

  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })

  if (!createRes.ok) {
    throw new Error('Failed to create Drive folder')
  }

  const createData = (await createRes.json()) as { id: string }
  await settingsRepository.set(FOLDER_ID_KEY, createData.id)
  return createData.id
}

export async function listDriveInvoices(token: string): Promise<Array<{ id: string; name: string }>> {
  const q = `name contains 'invoice-' and mimeType='application/json' and trashed=false`
  const res = await fetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) return []
  const data = (await res.json()) as { files?: Array<{ id: string; name: string }> }
  return data.files ?? []
}
