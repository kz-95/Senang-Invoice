import type { LineItem } from '@/lib/types'
import { getLlamaClient, getModel, type LlmClient } from './llmClient'
import { findClassification } from '@/services/compliance/classificationCatalog'
import { findUom } from '@/services/compliance/uomCatalog'
import { retrieveCodes } from '@/services/rag/retriever'

const SYSTEM_PROMPT = `You are a Malaysian e-invoice compliance mapper.
Given line items, the top matching IRBM classification code candidates, and classification rules, map each line to:
- classificationCode: one of the provided candidate codes
- uom: a UN/ECE Rec 20 code (default C62 for generic items)
- taxType: "01" (sales tax), "02" (service tax), "06" (exempt), "E" (zero-rated)
- taxAmount: computed tax (0 if exempt/zero-rated)
- confidence: number 0-1 indicating how confident you are in the classification match

Return ONLY a JSON array of objects: [{ "classificationCode": "...", "uom": "...", "taxType": "...", "taxAmount": 0, "confidence": 0.9 }]
One object per input line item, same order.`

export async function mapFields(
  items: LineItem[],
  clientOverride?: LlmClient
): Promise<LineItem[]> {
  if (items.length === 0) return []

  const client = clientOverride ?? getLlamaClient()
  if (!client) return items.map(it => ({ ...it, classificationCode: '045', uom: 'C62', taxType: '06', taxAmount: 0, confidence: 0 }))

  const allCandidates: Array<{ code: string; description: string; useWhen: string }> = []
  const allRules: Array<{ id: string; topic: string; text: string }> = []
  const seenCodes = new Set<string>()
  const seenRuleIds = new Set<string>()

  for (const item of items) {
    const { candidates, rules } = retrieveCodes(item.description)
    for (const c of candidates) {
      if (!seenCodes.has(c.code)) {
        seenCodes.add(c.code)
        allCandidates.push(c)
      }
    }
    for (const r of rules) {
      if (!seenRuleIds.has(r.id)) {
        seenRuleIds.add(r.id)
        allRules.push(r)
      }
    }
  }

  const catalogText = allCandidates
    .map(c => `${c.code}: ${c.description} - ${c.useWhen}`)
    .join('\n')

  const rulesText = allRules.map(r => `${r.topic}:\n${r.text}`).join('\n\n')

  const itemsText = items
    .map((it, i) => `${i + 1}. ${it.description} (qty=${it.qty}, unitPrice=${it.unitPrice})`)
    .join('\n')

  const response = await client.messages.create({
    model: getModel(),
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Classification candidates:\n${catalogText}\n\nClassification rules:\n${rulesText}\n\nLine items:\n${itemsText}`
    }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  const raw = textBlock && 'text' in textBlock ? textBlock.text ?? '' : ''

  let mappings: Array<{
    classificationCode: string
    uom: string
    taxType: string
    taxAmount: number
    confidence?: number
  }>

  try {
    mappings = JSON.parse(raw)
  } catch {
    return items.map(it => ({
      ...it,
      classificationCode: it.classificationCode || '045',
      uom: it.uom || 'C62',
      taxType: it.taxType || '06',
      taxAmount: it.taxAmount || 0,
      confidence: 0,
    }))
  }

  return items.map((item, i) => {
    const m = mappings[i]
    if (!m) {
      return { ...item, classificationCode: '045', uom: 'C62', taxType: '06', taxAmount: 0, confidence: 0 }
    }

    const validClass = findClassification(m.classificationCode) ? m.classificationCode : '045'
    const validUom = findUom(m.uom) ? m.uom : 'C62'
    const confidence = typeof m.confidence === 'number' ? Math.min(1, Math.max(0, m.confidence)) : 0.5

    if (!findClassification(m.classificationCode) || confidence < 0.3) {
      return {
        ...item,
        classificationCode: '045',
        uom: validUom,
        taxType: m.taxType || '06',
        taxAmount: Number(m.taxAmount) || 0,
        confidence: 0,
      }
    }

    return {
      ...item,
      classificationCode: validClass,
      uom: validUom,
      taxType: m.taxType || '06',
      taxAmount: Number(m.taxAmount) || 0,
      confidence,
    }
  })
}
