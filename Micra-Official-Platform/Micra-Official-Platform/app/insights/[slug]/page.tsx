import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedArticle, getPublicSiteSettings } from '../../../src/lib/public-content'
import { primaryNavigation } from '../../../src/lib/public-pages'
import { SiteFooter, SiteHeader } from '../../_components/public-components'

export const dynamic = 'force-dynamic'

type RouteProps = { params: Promise<{ slug: string }> }

function safeImageUrl(value: string | undefined) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getPublishedArticle(slug)
  if (!article) return { title: 'Insight not found' }
  return {
    title: article.content.seoTitle || article.content.title,
    description: article.content.seoDescription || article.content.summary,
    alternates: { canonical: `/insights/${encodeURIComponent(article.slug)}` },
  }
}

export default async function InsightArticlePage({ params }: RouteProps) {
  const { slug } = await params
  const [article, settings] = await Promise.all([
    getPublishedArticle(slug),
    getPublicSiteSettings(),
  ])
  if (!article) notFound()
  const configuredByUrl = new Map(settings.navigation.map(item => [item.url, item]))
  const requiredUrls = new Set(primaryNavigation.map(item => item.url))
  const navigation = [
    ...primaryNavigation.map(item => ({ ...item, ...configuredByUrl.get(item.url), url: item.url })),
    ...settings.navigation.filter(item => !requiredUrls.has(item.url)),
  ]
  const imageUrl = safeImageUrl(article.content.heroImage?.url)

  return (
    <div className="micra-site">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader siteName={settings.siteInfo.name || 'MICRA'} navigation={navigation} />
      <main id="main-content" className="article-public-main">
        <article className="article-public">
          <Link className="article-back-link" href="/insights">← All insights</Link>
          <p className="eyebrow">{article.content.category}</p>
          <h1>{article.content.title}</h1>
          <p className="article-public-summary">{article.content.summary}</p>
          {article.publishedAt && <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time>}
          {imageUrl && <img className="article-public-image" src={imageUrl} alt={article.content.heroImage?.altText ?? ''} />}
          <div className="article-public-body">
            {article.content.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </article>
      </main>
      <SiteFooter siteName={settings.siteInfo.name || 'MICRA'} navigation={navigation} email={settings.siteInfo.email} homeHref="/" />
    </div>
  )
}
