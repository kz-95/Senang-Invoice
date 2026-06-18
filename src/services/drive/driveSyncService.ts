import type { Invoice } from '@/lib/types'
import { getOrRefreshToken } from './driveAuth'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

export interface DriveSyncResult {
  fileId: string
  webViewLink?: string
}

export async function pushToDrive(
  invoice: Invoice,
  pdfBlob?: Blob
): Promise<DriveSyncResult> {
  const token = await getOrRefreshToken()

  const folderId = await findOrCreateFolder(token, 'Senang Invoice')

  const jsonContent = JSON.stringify(invoice, null, 2)
  const invoiceFileName = `invoice-${invoice.id.slice(0, 8)}.json`
  const jsonFileId = await uploadFile(token, folderId, invoiceFileName, new Blob([jsonContent], { type: 'application/json' }), 'application/json')

  if (pdfBlob) {
    const pdfFileName = `invoice-${invoice.id.slice(0, 8)}.pdf`
    await uploadFile(token, folderId, pdfFileName, pdfBlob, 'application/pdf')
  }

  return { fileId: jsonFileId }
}

async function uploadFile(
  token: string,
  folderId: string,
  fileName: string,
  blob: Blob,
  mimeType: string
): Promise<string> {
  const metadata = {
    name: fileName,
    mimeType,
    parents: [folderId],
  }

  const formData = new FormData()
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  formData.append('file', blob)

  const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Drive upload failed (${res.status}): ${err}`)
  }

  const data = (await res.json()) as { id: string; webViewLink?: string }
  return data.id
}

async function findOrCreateFolder(token: string, folderName: string): Promise<string> {
  const searchRes = await fetch(
    `${DRIVE_API_BASE}/files?q=name='${encodeURIComponent(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (searchRes.ok) {
    const searchData = (await searchRes.json()) as { files?: Array<{ id: string }> }
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id
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
  return createData.id
}

export async function listDriveInvoices(token: string): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(
    `${DRIVE_API_BASE}/files?q=name contains 'invoice-' and mimeType='application/json' and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) return []
  const data = (await res.json()) as { files?: Array<{ id: string; name: string }> }
  return data.files ?? []
}
