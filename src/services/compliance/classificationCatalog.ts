import codes from '@/data/classification-codes.json'

export type Classification = {
  code: string
  description: string
  category: string
  keywords: string[]
  examples: string[]
  useWhen: string
}

export const getAllClassifications = (): Classification[] => codes as Classification[]

export const findClassification = (code: string): Classification | undefined =>
  (codes as Classification[]).find(c => c.code === code)

export const searchClassifications = (q: string): Classification[] =>
  (codes as Classification[]).filter(
    c =>
      c.description.toLowerCase().includes(q.toLowerCase()) ||
      c.code.includes(q)
  )

export interface ScoredClassification {
  classification: Classification
  score: number
}

export function scoreByKeywords(terms: string[]): ScoredClassification[] {
  const lowerTerms = terms.map(t => t.toLowerCase())
  const catalog = codes as Classification[]

  const scored = catalog.map(c => {
    let score = 0
    const descLower = c.description.toLowerCase()
    const catLower = c.category.toLowerCase()

    for (const term of lowerTerms) {
      if (term.length <= 2) continue
      if (descLower.includes(term)) score += 3
      if (c.keywords.some(k => k.includes(term) || term.includes(k))) score += 2
      if (c.examples.some(e => e.toLowerCase().includes(term))) score += 1
      if (catLower.includes(term)) score += 1
    }

    return { classification: c, score }
  })

  const matched = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)

  // Always include 045 fallback when nothing useful matched
  if (matched.length === 0 || !matched.some(s => s.classification.code === '045')) {
    const fallback = scored.find(s => s.classification.code === '045')
    if (fallback) {
      matched.push({ classification: fallback.classification, score: 0 })
    }
  }

  return matched
}

export function searchByKeywords(terms: string[]): Classification[] {
  return scoreByKeywords(terms).map(s => s.classification)
}
