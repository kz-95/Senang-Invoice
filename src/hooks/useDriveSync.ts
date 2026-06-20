'use client'
import { useState } from 'react'

// Placeholder - real Google Drive sync implemented in Task 23
export function useDriveSync() {
  const [syncing, setSyncing] = useState(false)

  const sync = async (_invoiceId: string) => {
    setSyncing(true)
    // TODO: Task 23 - integrate Google Drive
    await new Promise(resolve => setTimeout(resolve, 500))
    setSyncing(false)
  }

  return { sync, syncing }
}
