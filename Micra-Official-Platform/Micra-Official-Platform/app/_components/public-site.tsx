import { getPublishedArticles, getPublicPage, getPublicSiteSettings } from '../../src/lib/public-content'
import { primaryNavigation, publicPages } from '../../src/lib/public-pages'
import ContactForm from './contact-form'
import {
  ClosingCta,
  ContactSection,
  ContentSection,
  HeroSection,
  InsightsCard,
  ManagedContentSection,
  PublicBlockSection,
  SiteFooter,
  SiteHeader,
} from './public-components'
import { resolveEnquiryType } from '../../src/lib/enquiry-types'

function safeHref(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  if (/^(mailto:|tel:)/i.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString()
  } catch {
    return '#'
  }
  return '#'
}

export async function PublicSitePage({ slug, enquiryType }: { slug: string, enquiryType?: string | string[] }) {
  const [page, settings] = await Promise.all([
    getPublicPage(slug),
    getPublicSiteSettings(),
  ])
  if (!page) return null
  const articles = slug === 'insights' ? await getPublishedArticles() : []

  const definition = publicPages[slug]
  const { content } = page
  const blocks = content.blocks ?? definition?.blocks ?? []
  const siteName = settings.siteInfo.name || 'MICRA'
  const configuredByUrl = new Map(settings.navigation.map(item => [safeHref(item.url), item]))
  const requiredUrls = new Set(primaryNavigation.map(item => item.url))
  const navigation = [
    ...primaryNavigation.map(item => ({
      ...item,
      ...configuredByUrl.get(item.url),
      url: item.url,
    })),
    ...settings.navigation
      .filter(item => !requiredUrls.has(safeHref(item.url)))
      .map(item => ({ ...item, url: safeHref(item.url) }))
      .filter(item => item.url !== '#'),
  ]
  const homeHref = slug === 'home' ? '#top' : '/'

  return (
    <div className="micra-site" id="top">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader siteName={siteName} navigation={navigation} />

      <main id="main-content">
        <HeroSection
          slug={slug}
          kicker={definition?.kicker ?? 'MICRA'}
          content={content}
        />

        {slug === 'contact' ? (
          <ContactSection
            email={settings.siteInfo.email}
            phone={settings.siteInfo.phone}
            address={settings.siteInfo.address}
            title={content.headline}
            description={content.description}
          >
            <ContactForm initialType={resolveEnquiryType(enquiryType)} />
          </ContactSection>
        ) : blocks.map(block => <PublicBlockSection block={block} key={block.id} />)}

        {slug === 'insights' && articles.length > 0 && (
          <ContentSection eyebrow="MICRA INSIGHTS" title="Published articles and perspectives">
            <div className="feature-grid">
              {articles.map(article => (
                <InsightsCard
                  key={article.slug}
                  title={article.content.title}
                  category={article.content.category}
                  publishedAt={article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  description={article.content.summary}
                  href={`/insights/${encodeURIComponent(article.slug)}`}
                />
              ))}
            </div>
          </ContentSection>
        )}

        {content.sections.map(section => <ManagedContentSection section={section} key={section.id} />)}

        {slug !== 'contact' && <ClosingCta href="/partnerships" />}
      </main>

      <SiteFooter
        siteName={siteName}
        navigation={navigation}
        email={settings.siteInfo.email}
        homeHref={homeHref}
      />
    </div>
  )
}
