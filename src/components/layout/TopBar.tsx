'use client'
import { usePathname, useRouter } from 'next/navigation'
import { APP_NAME } from '@/lib/constants'
import { LangToggle } from '@/components/common/LangToggle'

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-teal-700 text-white shadow-md pt-safe">
      <div className="flex items-center h-14 px-4">
        <h1 className="text-lg font-medium tracking-wide truncate flex-1">
          {APP_NAME}
        </h1>
        <LangToggle />
      </div>
    </header>
  )
}
