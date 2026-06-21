import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { NodeProvider } from '@/components/system/NodeProvider'

export const metadata: Metadata = {
  title: 'Senang Inv',
  description: 'Malaysian e-invoice made easy - snap, speak, submit.',
  manifest: '/manifest.json',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NodeProvider>
      <AppShell>{children}</AppShell>
    </NodeProvider>
  )
}
