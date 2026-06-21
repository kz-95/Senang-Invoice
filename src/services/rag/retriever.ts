import { getAllChunks, type Chunk } from './knowledgeStore'
import { scoreByKeywords } from '@/services/compliance/classificationCatalog'

/** Minimum word-match count before a chunk is considered relevant.
 *  Prevents single-word queries from leaking random chunks. */
const MIN_SCORE = 2

/** Important short tokens that must survive the ≤2-char filter.
 *  If a term matches one of these exactly (case-insensitive), keep it. */
const KEEP_SHORT = new Set([
  'b2b', 'b2c', 'b2g', 'ms', 'en', 'zh', 'my',  // buyer types, language codes, "MY"
  'qr', 'ai', 'rm', 'id', 'tin', 'sst',          // tech/acronyms
  '01', '02', '03', '04', '05', '06', '07', '08', '09', // tax/doc type codes
])

export function retrieve(query: string, k = 3): Chunk[] {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2 || KEEP_SHORT.has(t))

  const chunks = getAllChunks()

  const scored = chunks.map(chunk => {
    const chunkText = `${chunk.topic} ${chunk.text}`.toLowerCase()
    let score = 0
    for (const term of queryTerms) {
      if (chunkText.includes(term)) score++
    }
    return { chunk, score }
  })

  return scored
    .filter(s => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(s => s.chunk)
}

const CLASSIFICATION_RULE_IDS = ['classification', 'classification-categories', 'how-to-choose-code', 'b2b-b2c-b2g']

export interface RetrieveCodeResult {
  code: string
  description: string
  useWhen: string
  score: number
}

export function retrieveCodes(description: string, k = 5): {
  candidates: RetrieveCodeResult[]
  rules: Chunk[]
} {
  const terms = description
    .toLowerCase()
    .split(/[\s,;.\-]+/)
    .filter(t => t.length > 2)

  const matched = scoreByKeywords(terms)

  const maxScore = matched.length > 0 ? matched[0].score : 1

  const topK = matched.slice(0, k).map(s => ({
    code: s.classification.code,
    description: s.classification.description,
    useWhen: s.classification.useWhen,
    score: Math.min(1, s.score / Math.max(1, maxScore)),
  }))

  const fallback = matched.find(s => s.classification.code === '045')

  if (fallback && !topK.some(c => c.code === '045')) {
    topK.push({
      code: fallback.classification.code,
      description: fallback.classification.description,
      useWhen: fallback.classification.useWhen,
      score: 0,
    })
  }

  const allChunks = getAllChunks()
  const rules = allChunks.filter(c => CLASSIFICATION_RULE_IDS.includes(c.id))

  return { candidates: topK, rules }
}
