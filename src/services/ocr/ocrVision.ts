import { getVisionClient, VISION_MODEL, type LlmClient } from '@/services/ai/llmClient'

export interface OcrResult {
  text: string
  lines: string[]
  count: number
}

const OCR_PROMPT = `Transcribe ALL text in this image exactly as printed, line by line.
Return ONLY the raw text — no commentary, no markdown, no bullet points.`

/**
 * OCR an image by asking Gemini vision to transcribe it. Replaces the old
 * python OCR server (localhost:8502) so OCR works on-device with no extra
 * process. `clientOverride` is for tests.
 */
export async function ocrViaGemini(base64: string, clientOverride?: LlmClient): Promise<OcrResult> {
  const client = clientOverride ?? getVisionClient()
  if (!client) throw new Error('No vision (Gemini) key configured')

  const response = await client.messages.create({
    model: VISION_MODEL,
    max_tokens: 2048,
    system: OCR_PROMPT,
    messages: [{
      role: 'user',
      content: [{
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
      }],
    }],
  })

  const block = response.content.find(b => b.type === 'text')
  const text = block && 'text' in block ? (block.text ?? '') : ''
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  return { text, lines, count: lines.length }
}
