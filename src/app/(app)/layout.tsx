import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'

export const metadata: Metadata = {
  title: 'Senang Invoice',
  description: 'Malaysian e-invoice made easy — snap, speak, submit.',
  manifest: '/manifest.json',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
