import type { LineItem } from '@/lib/types'
import { getLlamaClient, getModel, type LlmClient } from './llmClient'

export interface ExtractionInput {
  imageBase64?: string
  transcript?: string
}

const SYSTEM_PROMPT = `You are an expert at extracting line items from receipts and spoken input.
Extract each item as a JSON array of objects with: description (string), qty (number), unitPrice (number).
Do NOT include classificationCode, uom, taxType, taxAmount - leave those blank strings/zeros.
Return ONLY a valid JSON array, no markdown, no explanation.`

export async function extractLineItems(
  input: ExtractionInput,
  llmKey?: string,
  llmModel?: string,
  llmBaseUrl?: string,
  llmProvider?: string,
  clientOverride?: LlmClient
): Promise<LineItem[]> {
  const client = clientOverride ?? getLlamaClient(llmKey, llmModel, llmBaseUrl, llmProvider)
  if (!client) return []

  const userContent: Array<Record<string, unknown>> = []

  if (input.imageBase64) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: input.imageBase64,
      },
    })
  }

  if (input.transcript) {
    userContent.push({ type: 'text', text: input.transcript })
  }

  if (userContent.length === 0) {
    return []
  }

  const response = await client.messages.create({
    model: getModel(llmModel),
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  const raw = textBlock && 'text' in textBlock ? textBlock.text ?? '' : ''

  let parsed: Array<{ description: string; qty: number; unitPrice: number }>
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }

  return parsed.map(item => ({
    description: item.description ?? '',
    qty: Number(item.qty) || 1,
    unitPrice: Number(item.unitPrice) || 0,
    amount: (Number(item.qty) || 1) * (Number(item.unitPrice) || 0),
    uom: '',
    classificationCode: '',
    taxType: '06',
    taxAmount: 0,
  }))
}
