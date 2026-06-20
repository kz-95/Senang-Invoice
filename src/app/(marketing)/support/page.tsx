'use client'
import Link from 'next/link'
import guideData from '@/data/guide/guide.json'
import { ScopeCheckCard } from '@/components/ask/ScopeCheckCard'
import { useT } from '@/hooks/useT'
import { useUiStore } from '@/stores/uiStore'
import { pickLoc, type Loc } from '@/lib/localize'

interface SupportArticle {
  slug: string
  title: Loc
  summary: Loc
}

export default function SupportPage() {
  const t = useT()
  const lang = useUiStore(s => s.lang)
  const articles = guideData.articles as unknown as SupportArticle[]

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 space-y-12">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold text-teal-900">{t('support.title')}</h1>
        <p className="mx-auto max-w-xl text-gray-600 leading-relaxed">{t('support.intro')}</p>
      </header>

      {/* Non-LLM ask - rule-based scope check, no AI key needed */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">{t('support.askTitle')}</h2>
        <p className="text-sm text-gray-500">{t('support.askDesc')}</p>
        <ScopeCheckCard />
      </div>

      {/* Guide */}
      <div className="space-y-4">
        <p className="text-sm text-gray-500">{t('support.guideHint')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map(article => (
            <Link
              key={article.slug}
              href={`/guide/${article.slug}`}
              className="group block rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-teal-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <h3 className="mb-1 text-sm font-semibold text-gray-900 group-hover:text-teal-700">{pickLoc(article.title, lang)}</h3>
              <p className="text-xs leading-relaxed text-gray-500">{pickLoc(article.summary, lang)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
