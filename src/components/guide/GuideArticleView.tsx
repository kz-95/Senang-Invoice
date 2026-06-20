'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUiStore } from '@/stores/uiStore'
import { useT } from '@/hooks/useT'
import { track } from '@/lib/analytics'
import { pickLoc, type Loc } from '@/lib/localize'
import { isMobileUserAgent } from '@/lib/device'
import { ArticleRenderer, type Block } from '@/components/guide/ArticleRenderer'

export interface LocBlock {
  type: string
  text?: Loc
  tone?: 'info' | 'warn' | 'tip'
  items?: Loc[]
  src?: string
  alt?: string
  label?: Loc
  href?: string
}

export interface LocArticle {
  slug: string
  title: Loc
  summary: Loc
  icon: string
  next?: string | null
  blocks: LocBlock[]
}

export interface NextMeta {
  slug: string
  title: Loc
}

export function GuideArticleView({
  article,
  nextMeta,
}: {
  article: LocArticle
  nextMeta: NextMeta | null
}) {
  const lang = useUiStore((s) => s.lang)
  const t = useT()

  // Detected client-side (the page is a static export — no request headers).
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile(isMobileUserAgent(navigator.userAgent))
  }, [])

  const resolved: Block[] = article.blocks.map((block) => ({
    type: block.type,
    tone: block.tone,
    src: block.src,
    alt: block.alt,
    href: block.href,
    ...(block.text !== undefined ? { text: pickLoc(block.text, lang) } : {}),
    ...(block.label !== undefined ? { label: pickLoc(block.label, lang) } : {}),
    ...(block.items !== undefined
      ? { items: block.items.map((item) => pickLoc(item, lang)) }
      : {}),
  }))

  return (
    <section className="py-12 px-4 max-w-3xl mx-auto">
      <Link
        href="/guide"
        className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('guide.backToGuide')}
      </Link>

      <h1 className="text-3xl font-bold text-teal-900 mb-2">{pickLoc(article.title, lang)}</h1>
      <p className="text-gray-500 mb-8">{pickLoc(article.summary, lang)}</p>

      <ArticleRenderer blocks={resolved} />

      {nextMeta && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">{t('guide.nextArticle')}</p>
          <Link
            href={`/guide/${nextMeta.slug}`}
            className="inline-flex items-center gap-2 text-teal-700 font-semibold hover:text-teal-900 transition-colors"
          >
            {pickLoc(nextMeta.title, lang)}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      )}

      {!nextMeta && (
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          {isMobile ? (
            <Link
              href="/welcome/3"
              onClick={() => track('guide_login_click')}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-8 text-base font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" />
              </svg>
              {t('guide.loginCta')}
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex min-h-[48px] cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-200 px-8 text-base font-semibold text-gray-500"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {t('landing.downloadNow')}
            </span>
          )}
        </div>
      )}
    </section>
  )
}
