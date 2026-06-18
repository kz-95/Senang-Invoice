import { apiBase } from '@/lib/apiBase'

export async function ocrImage(base64: string): Promise<string> {
  const res = await fetch(`${apiBase()}/api/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  })
  if (!res.ok) throw new Error('OCR failed')
  const data = await res.json() as { text: string }
  return data.text
}
