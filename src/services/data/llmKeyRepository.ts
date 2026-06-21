import { db, type LlmKeyRow } from './db'
import { safeRandomUUID } from '@/lib/crypto'

export const llmKeyRepository = {
  async getAll(): Promise<LlmKeyRow[]> {
    return db.llmKeys.orderBy('priority').toArray()
  },

  async getActive(): Promise<LlmKeyRow[]> {
    return db.llmKeys.where('isActive').equals(1).sortBy('priority')
  },

  async getById(id: string): Promise<LlmKeyRow | undefined> {
    return db.llmKeys.get(id)
  },

  async save(key: LlmKeyRow): Promise<void> {
    await db.llmKeys.put(key)
  },

  async remove(id: string): Promise<void> {
    await db.llmKeys.delete(id)
  },

  async clearAll(): Promise<void> {
    await db.llmKeys.clear()
  },

  async getPrimaryKey(): Promise<LlmKeyRow | undefined> {
    const active = await this.getActive()
    return active.find(k => !k.isFallback) ?? active[0]
  },

  async getPrimaryKeys(): Promise<LlmKeyRow[]> {
    const active = await this.getActive()
    return active.filter(k => !k.isFallback)
  },

  async seedFromEnvIfEmpty(): Promise<void> {
    const existing = await db.llmKeys.count()
    if (existing > 0) return

    // SECURITY: never read keys from a NEXT_PUBLIC_* var here - this is client-side
    // code, so the value would be inlined into the public browser bundle. Server
    // keys are seeded at runtime via the localhost-guarded /api/seed-keys route
    // (see src/lib/seed.ts). This env path is intentionally disabled.
    const envKey = process.env.DEFAULT_LLM_KEY
    if (!envKey) return

    await db.llmKeys.put({
      id: safeRandomUUID(),
      label: 'Default (from env)',
      provider: envKey.startsWith('sk-ant-') ? 'anthropic' : 'openai',
      apiKey: envKey,
      model: 'claude-opus-4-8',
      isActive: true,
      isFallback: false,
      priority: 0,
      createdAt: new Date().toISOString(),
    })
  },
}
