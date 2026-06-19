'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function Fab() {
  const pathname = usePathname()
  const hidden = ['/create', '/ask', '/settings', '/profile']
  if (hidden.some(p => pathname === p || pathname.startsWith(p + '/'))) return null

  return (
    <Link
      href="/create"
      className="fixed z-30 flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-lg hover:bg-teal-700 active:bg-teal-800 active:scale-95 transition-all duration-150 lg:hidden"
      style={{ bottom: `calc(5rem + env(safe-area-inset-bottom, 0px))`, right: '1rem' }}
      aria-label="Create invoice"
    >
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
      </svg>
    </Link>
  )
}
