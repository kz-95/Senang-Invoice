'use client'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_NAME } from '@/lib/constants'
import { LangToggle } from '@/components/common/LangToggle'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { useT } from '@/hooks/useT'

interface MarketingShellProps { children: ReactNode }

export function MarketingShell({ children }: MarketingShellProps) {
  const t = useT()
  const pathname = usePathname()
  // On mobile, guide articles drop the Home/Download/Support/About bar so the
  // reader stays focused (the bar is the sm:hidden block below).
  const isGuideRoute = pathname?.startsWith('/guide') ?? false

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <header className="sticky top-0 z-40 bg-teal-700 text-white shadow-md">
        <div className="flex items-center h-14 px-4 max-w-6xl mx-auto w-full">
          <Link href="/" className="text-lg font-medium tracking-wide hover:text-teal-100 transition-colors shrink-0">
            {APP_NAME}
          </Link>

          <nav className="hidden sm:flex items-center gap-6 ml-8">
            <Link href="/" className="text-sm text-teal-100 hover:text-white transition-colors">{t('nav.home')}</Link>
            <Link href="/#download" className="text-sm text-teal-100 hover:text-white transition-colors">{t('nav.download')}</Link>
            <Link href="/support" className="text-sm text-teal-100 hover:text-white transition-colors">{t('nav.support')}</Link>
            <Link href="/about" className="text-sm text-teal-100 hover:text-white transition-colors">{t('nav.about')}</Link>
          </nav>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <GoogleSignInButton />
            <LangToggle />
          </div>
        </div>

        {!isGuideRoute && (
          <div className="sm:hidden flex items-center gap-4 px-4 pb-2">
            <Link href="/" className="text-xs text-teal-100 hover:text-white transition-colors">{t('nav.home')}</Link>
            <Link href="/#download" className="text-xs text-teal-100 hover:text-white transition-colors">{t('nav.download')}</Link>
            <Link href="/support" className="text-xs text-teal-100 hover:text-white transition-colors">{t('nav.support')}</Link>
            <Link href="/about" className="text-xs text-teal-100 hover:text-white transition-colors">{t('nav.about')}</Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-8 px-4 text-center">
        <p className="text-sm text-gray-500">
          {APP_NAME} · {t('landing.footerText')}
        </p>
        <div className="mt-2">
          <LangToggle className="text-gray-600 hover:bg-gray-200 active:bg-gray-300" />
        </div>
      </footer>
    </div>
  )
}
