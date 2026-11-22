export type SectionBackground = 'white' | 'sand' | 'mint' | 'ocean'
export type SectionAlignment = 'left' | 'centre'

export type PublicContentCard = {
  title: string
  subtitle?: string
  description: string
  icon: string
  href?: string
  ctaLabel?: string
}

type PublicPageBlockBase = {
  id: string
  visible?: boolean
  background?: SectionBackground
  alignment?: SectionAlignment
}

export type PublicPageBlock =
  | (PublicPageBlockBase & {
      type: 'story'
      eyebrow?: string
      title: string
      paragraphs: string[]
    })
  | (PublicPageBlockBase & {
      type: 'cards'
      eyebrow?: string
      title: string
      description?: string
      cards: PublicContentCard[]
    })
  | (PublicPageBlockBase & {
      type: 'list'
      eyebrow?: string
      title: string
      description?: string
      items: string[]
      note?: string
    })
  | (PublicPageBlockBase & {
      type: 'business-model'
      eyebrow?: string
      title: string
      layers: { title: string, description: string }[]
      revenueSources: string[]
      note: string
    })
  | (PublicPageBlockBase & {
      type: 'impact'
      eyebrow?: string
      title: string
      groups: { title: string, icon: string, items: string[] }[]
      note: string
    })
  | (PublicPageBlockBase & {
      type: 'categories'
      eyebrow?: string
      title: string
      description: string
      categories: string[]
    })

export type ArticleContent = {
  title: string
  summary: string
  category: string
  body: string
  seoTitle: string
  seoDescription: string
  heroImage?: {
    url: string
    path: string
    altText: string
  }
}
