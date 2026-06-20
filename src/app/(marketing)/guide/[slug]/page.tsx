import { notFound } from 'next/navigation'
import guideData from '@/data/guide/guide.json'
import {
  GuideArticleView,
  type LocArticle,
  type NextMeta,
} from '@/components/guide/GuideArticleView'

interface GuideData {
  articles: LocArticle[]
}

const data = guideData as unknown as GuideData

export function generateStaticParams() {
  return data.articles.map((a) => ({ slug: a.slug }))
}

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = data.articles.find((a) => a.slug === slug)

  if (!article) {
    notFound()
  }

  const nextArticle = article.next
    ? data.articles.find((a) => a.slug === article.next)
    : null

  const nextMeta: NextMeta | null = nextArticle
    ? { slug: nextArticle.slug, title: nextArticle.title }
    : null

  return <GuideArticleView article={article} nextMeta={nextMeta} />
}
