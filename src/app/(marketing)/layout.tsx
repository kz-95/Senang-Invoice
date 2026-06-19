import type { Metadata } from 'next'
import { MarketingShell } from '@/components/marketing/MarketingShell'

export const metadata: Metadata = {
  title: 'Senang Invoice - Malaysian E-Invoice Made Easy',
  description: 'Not sure if e-invoicing applies to you? Start here. Snap, speak, submit your Malaysian e-invoices.',
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>
}
