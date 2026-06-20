'use client'
import Link from 'next/link'
import { useUiStore } from '@/stores/uiStore'
import { useT } from '@/hooks/useT'
import { pickLoc, type Loc } from '@/lib/localize'
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
    </section>
  )
}
