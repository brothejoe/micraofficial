import { createClient } from '@supabase/supabase-js'
import type { ArticleContent } from './content-model'
import type { PageContent } from './supabase'
import { publicPages, primaryNavigation, withPageBlockDefaults } from './public-pages'
import type { PublicPageBlock } from './content-model'

export type PublishedPage = {
  slug: string
  content: PageContent
}

export type PublishedArticle = {
  slug: string
  content: ArticleContent
  publishedAt: string | null
}

export type PublicNavigationItem = { label: string, url: string }
export type PublicSiteInfo = { name?: string, email?: string, phone?: string, address?: string }
export type PublicSiteSettings = { navigation: PublicNavigationItem[], siteInfo: PublicSiteInfo }

const defaultSiteSettings: PublicSiteSettings = {
  navigation: primaryNavigation,
  siteInfo: { name: 'MICRA' },
}

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url && !key) return null
  if (!url || !key) throw new Error('Public Supabase configuration is incomplete.')

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error('The configured Supabase URL is invalid.')
  }
  if ((parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') || url.includes('your-project')) {
    throw new Error('The configured Supabase URL is not a valid project URL.')
  }
  if (key.includes('your-supabase')) throw new Error('The configured Supabase publishable key is still a placeholder.')

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPageCta(value: unknown) {
  return isRecord(value) &&
    typeof value.label === 'string' &&
    typeof value.url === 'string' &&
    (value.style === 'primary' || value.style === 'outline' || value.style === 'light') &&
    typeof value.openNewTab === 'boolean' &&
    typeof value.visible === 'boolean'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function isPublicPageBlock(value: unknown): value is PublicPageBlock {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.type !== 'string' ||
      typeof value.title !== 'string') return false
  if (value.visible !== undefined && typeof value.visible !== 'boolean') return false
  if (value.background !== undefined && !['white', 'sand', 'mint', 'ocean'].includes(String(value.background))) return false
  if (value.alignment !== undefined && !['left', 'centre'].includes(String(value.alignment))) return false

  if (value.type === 'story') return isStringArray(value.paragraphs)
  if (value.type === 'cards') {
    return Array.isArray(value.cards) && value.cards.every(card =>
      isRecord(card) &&
      typeof card.title === 'string' &&
      typeof card.description === 'string' &&
      typeof card.icon === 'string' &&
      (card.subtitle === undefined || typeof card.subtitle === 'string') &&
      (card.href === undefined || typeof card.href === 'string') &&
      (card.ctaLabel === undefined || typeof card.ctaLabel === 'string'),
    )
  }
  if (value.type === 'list') return isStringArray(value.items) && (value.note === undefined || typeof value.note === 'string')
  if (value.type === 'business-model') {
    return Array.isArray(value.layers) &&
      value.layers.every(layer => isRecord(layer) && typeof layer.title === 'string' && typeof layer.description === 'string') &&
      isStringArray(value.revenueSources) &&
      typeof value.note === 'string'
  }
  if (value.type === 'impact') {
    return Array.isArray(value.groups) &&
      value.groups.every(group => isRecord(group) && typeof group.title === 'string' && typeof group.icon === 'string' && isStringArray(group.items)) &&
      typeof value.note === 'string'
  }
  if (value.type === 'categories') return typeof value.description === 'string' && isStringArray(value.categories)
  return false
}

function isPageContent(value: unknown): value is PageContent {
  if (!isRecord(value) || typeof value.name !== 'string' || typeof value.headline !== 'string' ||
      typeof value.description !== 'string' || !Array.isArray(value.sections)) {
    return false
  }
  if (value.cta !== undefined && !isPageCta(value.cta)) return false
  if (value.secondaryCta !== undefined && !isPageCta(value.secondaryCta)) return false
  if (value.blocks !== undefined && (!Array.isArray(value.blocks) || !value.blocks.every(isPublicPageBlock))) return false
  if (value.seo !== undefined && (!isRecord(value.seo) ||
      typeof value.seo.title !== 'string' ||
      typeof value.seo.description !== 'string' ||
      typeof value.seo.canonicalPath !== 'string')) return false
  if (value.heroImage !== undefined && (!isRecord(value.heroImage) ||
      typeof value.heroImage.url !== 'string' ||
      typeof value.heroImage.path !== 'string' ||
      typeof value.heroImage.altText !== 'string' ||
      (value.heroImage.focalPointX !== undefined && (typeof value.heroImage.focalPointX !== 'number' || value.heroImage.focalPointX < 0 || value.heroImage.focalPointX > 100)) ||
      (value.heroImage.focalPointY !== undefined && (typeof value.heroImage.focalPointY !== 'number' || value.heroImage.focalPointY < 0 || value.heroImage.focalPointY > 100)))) return false
  return value.sections.every(section =>
    isRecord(section) &&
    (typeof section.id === 'number' || typeof section.id === 'string') &&
    typeof section.title === 'string' &&
    typeof section.subtitle === 'string' &&
    typeof section.description === 'string' &&
    typeof section.type === 'string' &&
    typeof section.visible === 'boolean' &&
    typeof section.icon === 'string' &&
    (section.background === undefined || ['white', 'sand', 'mint', 'ocean'].includes(String(section.background))) &&
    (section.alignment === undefined || ['left', 'centre'].includes(String(section.alignment))) &&
    (section.focalPointX === undefined || (typeof section.focalPointX === 'number' && section.focalPointX >= 0 && section.focalPointX <= 100)) &&
    (section.focalPointY === undefined || (typeof section.focalPointY === 'number' && section.focalPointY >= 0 && section.focalPointY <= 100)),
  )
}

function isArticleContent(value: unknown): value is ArticleContent {
  if (!isRecord(value) ||
      typeof value.title !== 'string' ||
      typeof value.summary !== 'string' ||
      typeof value.category !== 'string' ||
      typeof value.body !== 'string' ||
      typeof value.seoTitle !== 'string' ||
      typeof value.seoDescription !== 'string') return false
  if (value.heroImage !== undefined && (!isRecord(value.heroImage) ||
      typeof value.heroImage.url !== 'string' ||
      typeof value.heroImage.path !== 'string' ||
      typeof value.heroImage.altText !== 'string')) return false
  return true
}

export async function getPublishedPage(slug: string): Promise<PublishedPage | { slug: string, archived: true } | null> {
  const client = getPublicClient()
  if (!client) return null

  const { data: archived, error: archiveError } = await client.rpc('is_page_archived', { p_slug: slug })
  if (archiveError) throw new Error(`Page publication status could not be checked: ${archiveError.message}`)
  if (archived === true) return { slug, archived: true }

  const { data: page, error: pageError } = await client
    .from('pages')
    .select('id, slug, published_version_id')
    .eq('slug', slug)
    .maybeSingle()
  if (pageError) throw new Error(`Published page could not be loaded: ${pageError.message}`)
  if (!page?.published_version_id) return null

  const { data: version, error: versionError } = await client
    .from('page_versions')
    .select('content')
    .eq('id', page.published_version_id)
    .eq('page_id', page.id)
    .not('published_at', 'is', null)
    .maybeSingle()
  if (versionError) throw new Error(`Published page content could not be loaded: ${versionError.message}`)
  if (!version || !isPageContent(version.content)) {
    throw new Error(`Published content for "${slug}" is missing or invalid.`)
  }
  return { slug: page.slug, content: withPageBlockDefaults(page.slug, version.content) }
}

export async function getPublicPage(slug: string): Promise<PublishedPage | null> {
  const published = await getPublishedPage(slug)
  if (published && 'archived' in published) return null
  if (published) return published
  const fallback = publicPages[slug]
  return fallback ? { slug: fallback.slug, content: withPageBlockDefaults(fallback.slug, fallback.content) } : null
}

export async function getPublishedArticles(): Promise<PublishedArticle[]> {
  const client = getPublicClient()
  if (!client) return []
  const { data: articles, error: articlesError } = await client
    .from('articles')
    .select('id, slug, published_version_id')
    .neq('workflow_status', 'archived')
    .not('published_version_id', 'is', null)
    .order('updated_at', { ascending: false })
  if (articlesError) throw new Error(`Published Insights articles could not be loaded: ${articlesError.message}`)
  if (!articles?.length) return []
  const versionIds = articles.flatMap(article => article.published_version_id ? [article.published_version_id] : [])
  const { data: versions, error: versionsError } = await client
    .from('article_versions')
    .select('id, article_id, content, published_at')
    .in('id', versionIds)
  if (versionsError) throw new Error(`Published Insights article content could not be loaded: ${versionsError.message}`)
  const versionsById = new Map((versions ?? []).map(version => [version.id, version]))
  return articles.flatMap(article => {
    const version = article.published_version_id ? versionsById.get(article.published_version_id) : undefined
    if (!version || version.article_id !== article.id || !isArticleContent(version.content)) {
      throw new Error(`Published article content for "${article.slug}" is missing or invalid.`)
    }
    return [{ slug: article.slug, content: version.content, publishedAt: version.published_at }]
  })
}

export async function getPublishedArticle(slug: string): Promise<PublishedArticle | null> {
  const client = getPublicClient()
  if (!client) return null
  const { data: article, error: articleError } = await client
    .from('articles')
    .select('id, slug, published_version_id')
    .eq('slug', slug)
    .neq('workflow_status', 'archived')
    .not('published_version_id', 'is', null)
    .maybeSingle()
  if (articleError) throw new Error(`Published article could not be loaded: ${articleError.message}`)
  if (!article?.published_version_id) return null
  const { data: version, error: versionError } = await client
    .from('article_versions')
    .select('content, published_at, article_id')
    .eq('id', article.published_version_id)
    .eq('article_id', article.id)
    .not('published_at', 'is', null)
    .maybeSingle()
  if (versionError) throw new Error(`Published article content could not be loaded: ${versionError.message}`)
  if (!version || !isArticleContent(version.content)) {
    throw new Error(`Published article content for "${slug}" is missing or invalid.`)
  }
  return { slug: article.slug, content: version.content, publishedAt: version.published_at }
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const client = getPublicClient()
  if (!client) return defaultSiteSettings

  const { data, error } = await client
    .from('site_settings')
    .select('key, value')
    .in('key', ['public_navigation', 'public_site_info'])
  if (error) throw new Error(`Public site settings could not be loaded: ${error.message}`)

  const navigationValue = data?.find(item => item.key === 'public_navigation')?.value
  const infoValue = data?.find(item => item.key === 'public_site_info')?.value
  const navigation = Array.isArray(navigationValue)
    ? navigationValue.filter((item): item is PublicNavigationItem =>
        isRecord(item) && typeof item.label === 'string' && typeof item.url === 'string',
      )
    : defaultSiteSettings.navigation
  const siteInfo = isRecord(infoValue)
    ? Object.fromEntries(
        Object.entries(infoValue).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
      ) as PublicSiteInfo
    : defaultSiteSettings.siteInfo

  return { navigation, siteInfo: { ...defaultSiteSettings.siteInfo, ...siteInfo } }
}
