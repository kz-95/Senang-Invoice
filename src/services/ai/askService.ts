import type { AskMessage, Lang } from '@/lib/types'
import { getLlamaClient, getModel, type LlmClient } from './llmClient'
import { retrieve } from '@/services/rag/retriever'

const SYSTEM_PROMPT = `You are Senang Invoice, an expert on Malaysian e-invoicing (MyInvois).
Use the provided knowledge chunks to answer the user's question accurately.
IMPORTANT: Detect the user's language (Malay, Mandarin, English, or rojak mix) and reply in the SAME language.
If the user writes in rojak (mixed Malay/English), reply in rojak.
Be concise and helpful. Cite specific rules when relevant.`

function detectLang(text: string): Lang {
  const hasMalay = /\b(saya|apa|boleh|tidak|macam|mana|ini|itu|dan|untuk|ada)\b/i.test(text)
  const hasChinese = /[\u4e00-\u9fff]/.test(text)
  const hasEnglish = /\b(the|is|are|how|what|can|do|my|this|that)\b/i.test(text)

  if (hasChinese) return 'zh'
  if (hasMalay && hasEnglish) return 'rojak'
  if (hasMalay) return 'ms'
  return 'en'
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

  const chunks = retrieve(input.message, 3)
  const lang = detectLang(input.message)

  // Degraded path — no LLM client available, return raw RAG chunks
  if (!client) {
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

  const context = chunks.map(c => `[${c.topic}]: ${c.text}`).join('\n\n')

  const messages = [
    ...input.history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    })),
    { role: 'user' as const, content: input.message },
  ]

  const response = await client.messages.create({
    model: getModel(llmModel),
    max_tokens: 1500,
    system: `${SYSTEM_PROMPT}\n\nKnowledge:\n${context}`,
    messages,
  })

  const textBlock = response.content.find(b => b.type === 'text')
  const text = textBlock && 'text' in textBlock ? textBlock.text ?? '' : 'Sorry, I could not process that.'

  return { text, lang }
}
