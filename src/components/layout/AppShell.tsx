'use client'
import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { DemoBanner } from './DemoBanner'
import { BottomNav } from './BottomNav'
import { Fab } from './Fab'
import { Snackbar } from '@/components/common/Snackbar'

interface AppShellProps { children: ReactNode }

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <TopBar />
      <DemoBanner />
      <main className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden max-w-2xl mx-auto w-full px-4 py-4 lg:pb-0" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        {children}
      </main>
      <BottomNav />
      <Fab />
      <Snackbar />
    </div>
  )
}
