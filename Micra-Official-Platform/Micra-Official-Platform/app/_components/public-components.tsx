import Link from 'next/link'
import {
  ArrowRight, ArrowUpRight, Droplets, Globe2, Leaf, Search,
  Settings2, Sun, Users, Waves, Wind,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PageContent } from '../../src/lib/supabase'
import type { PublicPageBlock } from '../../src/lib/public-pages'

const currentYear = new Date().getFullYear()

const sectionIcons: Record<string, LucideIcon> = {
  sun: Sun,
  waves: Waves,
  leaf: Leaf,
  grid: Globe2,
  users: Users,
  search: Search,
  settings: Settings2,
  wind: Wind,
}

export type SiteNavigationItem = { label: string, url: string }
export type SiteInfo = { name?: string, email?: string, phone?: string, address?: string }
export type PublicSection = PageContent['sections'][number]
type PublicSectionContent = PublicSection
type FeatureCardData = {
  id?: number | string
  title: string
  subtitle?: string
  description: string
  icon: string
  imageUrl?: string
  imageAltText?: string
  href?: string
  ctaLabel?: string
}
export type ButtonVariant = 'primary' | 'secondary' | 'light' | 'text'

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

function safeImageUrl(value: string | undefined) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export function CtaButton({
  href,
  children,
  variant = 'primary',
  className = '',
  target,
}: {
  href: string
  children: ReactNode
  variant?: ButtonVariant
  className?: string
  target?: '_blank'
}) {
  return (
    <Link
      className={`button-${variant} ${className}`.trim()}
      href={safeHref(href)}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
    >
      {children}<ArrowRight size={17} aria-hidden="true" />
    </Link>
  )
}

export function SiteHeader({
  siteName,
  navigation,
}: {
  siteName: string
  navigation: SiteNavigationItem[]
}) {
  const primaryItems = navigation.slice(0, 4)
  const additionalItems = navigation.slice(4).filter(item => item.url !== '/contact')
  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <Link className="site-brand" href="/" aria-label={`${siteName} home`}>
          <span className="brand-symbol"><Waves size={21} strokeWidth={2.2} aria-hidden="true" /></span>
          <span>{siteName}<small>Regenerative Aquaculture</small></span>
        </Link>
        <details className="mobile-menu">
          <summary aria-label="Toggle navigation menu"><span className="menu-icon"><span /><span /></span><span className="menu-label">Menu</span></summary>
          <nav aria-label="Mobile navigation">
            {navigation.map(item => <Link key={item.url} href={safeHref(item.url)}>{item.label}</Link>)}
          </nav>
        </details>
        <nav className="desktop-nav" aria-label="Main navigation">
          {primaryItems.map(item => <Link key={item.url} href={safeHref(item.url)}>{item.label}</Link>)}
          {additionalItems.length > 0 && (
            <details className="desktop-more-menu">
              <summary>Explore</summary>
              <div>{additionalItems.map(item => <Link key={item.url} href={safeHref(item.url)}>{item.label}</Link>)}</div>
            </details>
          )}
        </nav>
        <Link className="header-cta" href="/contact">Contact MICRA <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </div>
    </header>
  )
}

export function HeroSection({
  slug,
  kicker,
  content,
}: {
  slug: string
  kicker: string
  content: PageContent
}) {
  const cta = content.cta?.visible ? content.cta : undefined
  const secondaryCta = content.secondaryCta?.visible ? content.secondaryCta : undefined
  const imageUrl = safeImageUrl(content.heroImage?.url)

  return (
    <section className={`site-hero ${slug === 'home' ? 'home-hero' : 'inner-hero'}`}>
      <div className="site-container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true" />{kicker}</p>
          <h1>{content.headline || content.name}</h1>
          <p className="hero-description">{content.description}</p>
          {(cta || secondaryCta) && (
            <div className="hero-actions">
              {cta && (
                <CtaButton className={`cta-${cta.style}`} href={cta.url} target={cta.openNewTab ? '_blank' : undefined}>
                  {cta.label}
                </CtaButton>
              )}
              {secondaryCta && (
                <CtaButton className={`cta-${secondaryCta.style}`} href={secondaryCta.url} target={secondaryCta.openNewTab ? '_blank' : undefined}>
                  {secondaryCta.label}
                </CtaButton>
              )}
            </div>
          )}
        </div>
        <figure className="hero-art">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={content.heroImage?.altText ?? ''}
              style={{ objectPosition: `${content.heroImage?.focalPointX ?? 50}% ${content.heroImage?.focalPointY ?? 50}%` }}
            />
          ) : (
            <img
              src="/micra-cluster-illustration.svg"
              alt="Illustrative cluster concept showing farmer-owned ponds and shared water systems; not a site plan or record of an implemented MICRA project."
              width="640"
              height="520"
            />
          )}
          {!imageUrl && (
            <figcaption className="art-caption"><Droplets size={15} aria-hidden="true" /> Illustrative concept, not project evidence</figcaption>
          )}
        </figure>
      </div>
      <div className="hero-bottom-line" aria-hidden="true" />
    </section>
  )
}

export function ContentSection({
  eyebrow,
  title,
  description,
  children,
  className = '',
}: {
  eyebrow?: string
  title?: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`content-section ${className}`.trim()}>
      <div className="site-container">
        {(eyebrow || title || description) && (
          <div className="section-heading">
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && <h2>{title}</h2>}
            </div>
            {description && <p>{description}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

export function ImageTextSection({
  eyebrow,
  title,
  description,
  imageUrl,
  imageAlt,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  imageUrl: string
  imageAlt: string
  children?: ReactNode
}) {
  const safeUrl = safeImageUrl(imageUrl)
  return (
    <section className="image-text-section site-container">
      {safeUrl && <img src={safeUrl} alt={imageAlt} loading="lazy" />}
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {children}
      </div>
    </section>
  )
}

export function FeatureCard({
  section,
  index = 0,
  kind = 'feature',
}: {
  section: FeatureCardData
  index?: number
  kind?: 'feature' | 'solution'
}) {
  const Icon = sectionIcons[section.icon] ?? Droplets
  const imageUrl = safeImageUrl(section.imageUrl)
  return (
    <article className={`feature-card feature-card-${index % 3} ${kind === 'solution' ? 'solution-card' : ''}`}>
      <div className="feature-topline"><span>{String(index + 1).padStart(2, '0')}</span><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></div>
      {imageUrl && <img className="feature-image" src={imageUrl} alt={section.imageAltText ?? ''} loading="lazy" />}
      {section.subtitle && <p className="feature-subtitle">{section.subtitle}</p>}
      <h3>{section.title}</h3>
      <p className="feature-description">{section.description}</p>
      {section.href && <Link className="text-link feature-link" href={safeHref(section.href)}>{section.ctaLabel ?? 'Learn more'}<ArrowRight size={16} aria-hidden="true" /></Link>}
    </article>
  )
}

export function FeatureCards({
  sections,
  kind = 'feature',
}: {
  sections: FeatureCardData[]
  kind?: 'feature' | 'solution'
}) {
  return (
    <div className="feature-grid">
      {sections.map((section, index) => <FeatureCard key={section.id ?? `${section.title}-${index}`} section={section} index={index} kind={kind} />)}
    </div>
  )
}

export function PublicBlockSection({ block }: { block: PublicPageBlock }) {
  if (block.visible === false) return null
  const className = [
    'public-content-block',
    `block-background-${block.background ?? 'sand'}`,
    `block-alignment-${block.alignment ?? 'left'}`,
  ].join(' ')
  if (block.type === 'story') {
    return (
      <ContentSection eyebrow={block.eyebrow} title={block.title} className={`${className} story-section`}>
        <div className="story-copy">{block.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      </ContentSection>
    )
  }
  if (block.type === 'cards') {
    return (
      <ContentSection eyebrow={block.eyebrow} title={block.title} description={block.description} className={className}>
        <FeatureCards sections={block.cards} />
      </ContentSection>
    )
  }
  if (block.type === 'list') {
    return (
      <ContentSection eyebrow={block.eyebrow} title={block.title} description={block.description} className={className}>
        <ul className="public-list">{block.items.map(item => <li key={item}>{item}</li>)}</ul>
        {block.note && <p className="content-note">{block.note}</p>}
      </ContentSection>
    )
  }
  if (block.type === 'business-model') {
    return (
      <ContentSection eyebrow={block.eyebrow} title={block.title} className={className}>
        <BusinessModelDiagram layers={block.layers} />
        <h3 className="subsection-title">Potential MICRA revenue sources</h3>
        <ul className="public-list public-list-columns">{block.revenueSources.map(item => <li key={item}>{item}</li>)}</ul>
        <p className="content-note">{block.note}</p>
      </ContentSection>
    )
  }
  if (block.type === 'impact') {
    return (
      <ContentSection eyebrow={block.eyebrow} title={block.title} className={className}>
        <div className="impact-grid">
          {block.groups.map(group => {
            const Icon = sectionIcons[group.icon] ?? Leaf
            return (
              <article className="impact-card" key={group.title}>
                <Icon size={22} aria-hidden="true" />
                <h3>{group.title}</h3>
                <ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul>
              </article>
            )
          })}
        </div>
        <p className="content-note">{block.note}</p>
      </ContentSection>
    )
  }
  return (
    <ContentSection eyebrow={block.eyebrow} title={block.title} description={block.description} className={className}>
      <ul className="category-list">{block.categories.map(category => <li key={category}>{category}</li>)}</ul>
    </ContentSection>
  )
}

export function ManagedContentSection({ section }: { section: PublicSectionContent }) {
  if (!section.visible) return null
  const Icon = sectionIcons[section.icon] ?? Droplets
  const focalX = section.focalPointX ?? 50
  const focalY = section.focalPointY ?? 50
  const imageUrl = safeImageUrl(section.imageUrl)
  return (
    <section className={`managed-content-section managed-background-${section.background ?? 'sand'} managed-alignment-${section.alignment ?? 'left'}`}>
      <div className="site-container managed-content-inner">
        <div className="managed-section-heading">
          <Icon size={22} aria-hidden="true" />
          {section.subtitle && <p className="eyebrow">{section.subtitle}</p>}
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </div>
        {imageUrl && (
          <img
            className="managed-section-image"
            src={imageUrl}
            alt={section.imageAltText ?? ''}
            loading="lazy"
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
          />
        )}
      </div>
    </section>
  )
}

export function BusinessModelDiagram({
  layers,
}: {
  layers: { title: string, description: string }[]
}) {
  return (
    <ol className="business-model-diagram">
      {layers.map((layer, index) => (
        <li key={layer.title}>
          <span className="diagram-number">0{index + 1}</span>
          <div><h3>{layer.title}</h3><p>{layer.description}</p></div>
        </li>
      ))}
    </ol>
  )
}

export function ImpactIndicators({
  indicators,
}: {
  indicators: { category: string, title: string, description: string, status?: string }[]
}) {
  return (
    <div className="impact-grid">
      {indicators.map(indicator => (
        <article className="impact-card" key={indicator.title}>
          <p className="feature-subtitle">{indicator.category}</p>
          <h3>{indicator.title}</h3>
          <p className="feature-description">{indicator.description}</p>
          {indicator.status && <p className="indicator-status">{indicator.status}</p>}
        </article>
      ))}
    </div>
  )
}

export function PartnershipCard({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string
  description: string
  href: string
  linkLabel: string
}) {
  return (
    <article className="partnership-card">
      <Users size={22} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href={safeHref(href)} className="text-link">{linkLabel}<ArrowRight size={16} aria-hidden="true" /></Link>
    </article>
  )
}

export function TestimonialCard({
  quote,
  name,
  role,
  organisation,
}: {
  quote: string
  name: string
  role: string
  organisation: string
}) {
  return (
    <figure className="testimonial-card">
      <blockquote>{quote}</blockquote>
      <figcaption><strong>{name}</strong><span>{role}{organisation ? `, ${organisation}` : ''}</span></figcaption>
    </figure>
  )
}

export function InsightsCard({
  title,
  category,
  publishedAt,
  description,
  href,
}: {
  title: string
  category: string
  publishedAt: string
  description: string
  href: string
}) {
  return (
    <article className="insights-card">
      <p className="feature-subtitle">{category}</p>
      <h3><Link href={safeHref(href)}>{title}</Link></h3>
      <time dateTime={publishedAt}>{publishedAt}</time>
      <p className="feature-description">{description}</p>
      <Link className="text-link" href={safeHref(href)}>Read insight <ArrowUpRight size={15} aria-hidden="true" /></Link>
    </article>
  )
}

export function ContactSection({
  email,
  phone,
  address,
  title,
  description,
  children,
}: {
  email?: string
  phone?: string
  address?: string
  title?: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="contact-section site-container">
      <div className="contact-copy">
        <p className="eyebrow">GET IN TOUCH</p>
        <h2>{title || 'Tell us what you’re working on.'}</h2>
        <p>{description || 'Share a few details about your water system or partnership idea. We’ll use your message to understand how MICRA may be able to help.'}</p>
        {email && <a className="contact-detail" href={`mailto:${email}`}>{email}</a>}
        {phone && <a className="contact-detail" href={`tel:${phone}`}>{phone}</a>}
        {address && <p className="contact-detail">{address}</p>}
      </div>
      {children}
    </section>
  )
}

export function ClosingCta({ href = '/partnerships' }: { href?: string }) {
  return (
    <section className="closing-cta">
      <div className="site-container closing-inner">
        <div><p className="eyebrow">LET’S WORK TOGETHER</p><h2>Explore a partnership pathway with MICRA.</h2><p>Discuss your goals, role and the evidence needed to define a potential collaboration.</p></div>
        <CtaButton href={href} variant="light">Explore partnerships</CtaButton>
      </div>
    </section>
  )
}

export function SiteFooter({
  siteName,
  navigation,
  email,
  homeHref,
}: {
  siteName: string
  navigation: SiteNavigationItem[]
  email?: string
  homeHref: string
}) {
  return (
    <footer className="site-footer">
      <div className="site-container footer-main">
        <div>
          <Link className="site-brand footer-brand" href={homeHref}>
            <span className="brand-symbol"><Waves size={21} aria-hidden="true" /></span>
            <span>{siteName}<small>Regenerative Aquaculture</small></span>
          </Link>
          <p className="footer-summary">A developer and implementation platform connecting farmers, shared infrastructure, and responsible aquaculture.</p>
        </div>
        <div className="footer-links">
          <p>Explore</p>
          {navigation.slice(0, 4).map(item => <Link key={item.url} href={safeHref(item.url)}>{item.label}</Link>)}
        </div>
        <div className="footer-links">
          <p>Connect</p>
          <Link href="/contact">Contact MICRA</Link>
          {email && <a href={`mailto:${email}`}>{email}</a>}
        </div>
      </div>
      <div className="site-container footer-bottom">
        <span>© {currentYear} {siteName}</span>
        <span>Better farming systems. Stronger coastal communities. More responsible aquaculture.</span>
      </div>
    </footer>
  )
}
