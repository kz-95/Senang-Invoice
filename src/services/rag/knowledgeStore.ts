import chunks from '@/data/irbm-knowledge.json'

export interface Chunk {
  id: string
  topic: string
  text: string
}

export function getAllChunks(): Chunk[] {
  return chunks as Chunk[]
}
