import { notFound } from 'next/navigation'
import Link from 'next/link'
import guideData from '@/data/guide/guide.json'
import { ArticleRenderer } from '@/components/guide/ArticleRenderer'
import type { Block } from '@/components/guide/ArticleRenderer'

interface GuideArticle {
  slug: string
  title: string
  summary: string
  icon: string
  next?: string
  blocks: Block[]
}

interface GuideData {
  articles: GuideArticle[]
}

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = (guideData as unknown as GuideData).articles.find((a) => a.slug === slug)

  if (!article) {
    notFound()
  }

  const nextArticle = article.next
    ? (guideData as unknown as GuideData).articles.find((a) => a.slug === article.next)
    : null

  return (
    <section className="py-12 px-4 max-w-3xl mx-auto">
      <Link
        href="/guide"
        className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Guide
      </Link>

      <h1 className="text-3xl font-bold text-teal-900 mb-2">{article.title}</h1>
      <p className="text-gray-500 mb-8">{article.summary}</p>

      <ArticleRenderer blocks={article.blocks} />

      {nextArticle && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Next article</p>
          <Link
            href={`/guide/${nextArticle.slug}`}
            className="inline-flex items-center gap-2 text-teal-700 font-semibold hover:text-teal-900 transition-colors"
          >
            {nextArticle.title}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      )}
    </section>
  )
}
