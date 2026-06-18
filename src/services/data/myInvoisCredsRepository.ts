import { db, type MyInvoisCredsRow } from './db'

const SINGLETON_ID = 'default'

export interface MyInvoisCreds { label: string; clientId: string; clientSecret: string }

export const myInvoisCredsRepository = {
  async get(): Promise<MyInvoisCreds | null> {
    const row = await db.myInvoisCreds.get(SINGLETON_ID)
    if (!row) return null
    return { label: row.label, clientId: row.clientId, clientSecret: row.clientSecret }
  },
  async save(creds: MyInvoisCreds): Promise<void> {
    const row: MyInvoisCredsRow = {
      id: SINGLETON_ID, label: creds.label, clientId: creds.clientId, clientSecret: creds.clientSecret,
      updatedAt: new Date().toISOString(),
    }
    await db.myInvoisCreds.put(row)
  },
  async clear(): Promise<void> {
    await db.myInvoisCreds.clear()
  },
}
