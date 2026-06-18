'use client'
import { usePathname, useRouter } from 'next/navigation'
import { APP_NAME } from '@/lib/constants'
import { LangToggle } from '@/components/common/LangToggle'

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/dashboard'

  return (
    <header className="sticky top-0 z-40 bg-teal-700 text-white shadow-md">
      <div className="flex items-center h-14 px-2">
        <div className="w-12">
          {!isHome && (
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
          )}
        </div>

        <h1 className="text-lg font-medium tracking-wide ml-2 truncate flex-1">
          {APP_NAME}
        </h1>

        <LangToggle />
      </div>
    </header>
  )
}
