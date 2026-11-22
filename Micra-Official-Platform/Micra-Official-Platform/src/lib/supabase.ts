import { createClient } from '@supabase/supabase-js'
import type { ArticleContent, PublicPageBlock, SectionAlignment, SectionBackground } from './content-model'

export type WorkflowStatus = 'draft' | 'review' | 'published' | 'archived'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

const hasAnySupabaseConfig = Boolean(supabaseUrl || supabaseAnonKey)
const validSupabaseUrl = (() => {
  if (!supabaseUrl) return false
  try {
    const url = new URL(supabaseUrl)
    return url.protocol === 'https:' || url.hostname === 'localhost'
  } catch {
    return false
  }
})()

export const supabaseConfigurationError = hasAnySupabaseConfig
  ? !supabaseUrl || !supabaseAnonKey
    ? 'Lengkapi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.example.'
    : !validSupabaseUrl || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-supabase')
      ? 'Konfigurasi Supabase masih berupa placeholder atau URL tidak valid.'
      : ''
  : ''
export const isSupabaseConfigured = hasAnySupabaseConfig && !supabaseConfigurationError
export const supabaseProjectRef = validSupabaseUrl ? new URL(supabaseUrl as string).hostname.split('.')[0] : ''

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null

export type AdminRole = 'super_admin' | 'content_admin' | 'editor'

export type PageCta = {
  label: string
  url: string
  style: 'primary' | 'outline' | 'light'
  openNewTab: boolean
  visible: boolean
}

export type PageContent = {
  name: string
  headline: string
  description: string
  blocks?: PublicPageBlock[]
  seo?: {
    title: string
    description: string
    canonicalPath: string
  }
  cta?: PageCta
  secondaryCta?: PageCta
  heroImage?: {
    url: string
    path: string
    altText: string
    focalPointX?: number
    focalPointY?: number
  }
  sections: {
    id: number
    title: string
    subtitle: string
    description: string
    type: string
    visible: boolean
    icon: string
    imageUrl?: string
    imagePath?: string
    imageAltText?: string
    background?: SectionBackground
    alignment?: SectionAlignment
    focalPointX?: number
    focalPointY?: number
  }[]
}

export type CmsPage = {
  id: string
  slug: string
  name: string
  draft_version_id: string | null
  published_version_id: string | null
  workflow_status: WorkflowStatus
}

export type CmsArticleVersion = {
  id: string
  article_id: string
  version_number: number
  content: ArticleContent
  created_at: string
  published_at: string | null
  author?: string
}

export type CmsArticle = {
  id: string
  slug: string
  workflow_status: WorkflowStatus
  draft_version_id: string | null
  published_version_id: string | null
  created_at: string
  updated_at: string
  draftContent?: ArticleContent
  versions: CmsArticleVersion[]
}

export type CmsVersion = {
  id: string
  page_id: string
  version_number: number
  content: PageContent
  created_at: string
  published_at: string | null
  author?: string
}

export type PublishedArticle = {
  slug: string
  content: ArticleContent
  published_at: string
}

export type AdminProfile = {
  id: string
  full_name: string
  role: AdminRole | 'pending'
  created_at: string
}

export type CmsEnquiry = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'pending' | 'replied' | 'archived'
  created_at: string
}

export type CmsActivity = {
  id: number
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  created_at: string
}

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.example.')
  }
  return supabase
}
