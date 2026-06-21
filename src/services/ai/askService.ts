import type { AskMessage, Lang } from '@/lib/types'
import { getLlamaClient, getModel, type LlmClient } from './llmClient'
import { retrieve } from '@/services/rag/retriever'

const SYSTEM_PROMPT = `You are Senang Invoice, an expert on Malaysian e-invoicing (MyInvois).
Use the provided knowledge chunks to answer the user's question accurately.
IMPORTANT: Detect the user's language (Malay, Mandarin, or English) and reply in the SAME language.
Be concise and helpful. Cite specific rules when relevant.`

function detectLang(text: string): Lang {
  const hasMalay = /\b(saya|apa|boleh|tidak|macam|mana|ini|itu|dan|untuk|ada)\b/i.test(text)
  const hasChinese = /[\u4e00-\u9fff]/.test(text)
  const hasEnglish = /\b(the|is|are|how|what|can|do|my|this|that)\b/i.test(text)

  if (hasChinese) return 'zh'
  if (hasMalay) return 'ms'
  return 'en'
}

/**
 * Non-LLM reply built purely from retrieved IRBM knowledge chunks.
 * Used when no LLM key is available, or when a provider returns 429/402 and we
 * fall back instead of retrying. Always marks the result degraded.
 */
export function degradedAnswer(message: string): { text: string; lang: Lang; degraded: true } {
  const chunks = retrieve(message, 3)
  const lang = detectLang(message)

  if (chunks.length === 0) {
    const msg = lang === 'ms'
      ? 'Maaf, saya tidak menjumpai pengetahuan IRBM yang berkaitan untuk soalan itu. Cuba gunakan lebih banyak kata kunci seperti "cukai putaran", "invois konsolidasi", atau "pengecualian".'
      : lang === 'zh'
        ? '抱歉，在 IRBM 知识库中找不到与您问题相关的内容。请尝试使用更多关键词，如"营业额"、"合并发票"或"豁免"。'
        : 'Sorry, I did not find matching IRBM knowledge for that query. Try using more keywords like "turnover", "consolidated invoice", or "exemption".'
    return { text: msg, lang, degraded: true }
  }

  const chunkLines = chunks.map(c => `• **${c.topic}**: ${c.text}`).join('\n')
  const wrapper = lang === 'ms'
    ? 'Berikut yang pengetahuan IRBM katakan:\n\n'
    : lang === 'zh'
      ? '以下是 IRBM 知识库的内容：\n\n'
      : "Here's what the IRBM knowledge says:\n\n"
  const footer = lang === 'ms'
    ? '\n\n(Tambah kunci AI di Tetapan untuk jawapan terus dan pelbagai bahasa.)'
    : lang === 'zh'
      ? '\n\n（在设置中添加 AI 密钥以获取直接的多语言答案。）'
      : '\n\n(Add an AI key in Settings for a direct, multilingual answer.)'
  return { text: `${wrapper}${chunkLines}${footer}`, lang, degraded: true }
}

export async function answer(
  input: { message: string; history: AskMessage[] },
  llmKey?: string,
  llmModel?: string,
  llmBaseUrl?: string,
  llmProvider?: string,
  clientOverride?: LlmClient
): Promise<{ text: string; lang: Lang; degraded?: boolean }> {
  const client = clientOverride ?? getLlamaClient(llmKey, llmModel, llmBaseUrl, llmProvider)

  // Degraded path - no LLM client available, return raw RAG chunks
  if (!client) {
    return degradedAnswer(input.message)
  }

  const chunks = retrieve(input.message, 3)
  const lang = detectLang(input.message)

  const context = chunks.length > 0
    ? chunks.map(c => `[${c.topic}]: ${c.text}`).join('\n\n')
    : 'No specific IRBM knowledge chunks matched this query. Answer based on your general knowledge of Malaysian e-invoicing.'

  const messages = [
    ...input.history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    })),
    { role: 'user' as const, content: input.message },
  ]

  const response = await client.messages.create({
    model: getModel(llmModel),
    max_tokens: 2048,
    system: `${SYSTEM_PROMPT}\n\nKnowledge:\n${context}`,
    messages,
  })

  const textBlock = response.content.find(b => b.type === 'text')
  const text = textBlock && 'text' in textBlock ? textBlock.text ?? '' : 'Sorry, I could not process that.'

  return { text, lang }
}
