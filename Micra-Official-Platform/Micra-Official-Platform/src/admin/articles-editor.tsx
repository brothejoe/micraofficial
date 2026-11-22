"use client"

import { useEffect, useMemo, useState } from 'react'
import { Archive, Eye, FilePlus2, History, RotateCcw, Save, Send } from 'lucide-react'
import type { ArticleContent } from '../lib/content-model'
import {
  archiveArticle, createArticle, loadAdminArticles, publishArticle, requestArticleReview,
  restoreArticleVersion, saveArticleDraft,
} from '../lib/cms'
import type { CmsArticle } from '../lib/supabase'

const categories = [
  'Regenerative Aquaculture',
  'Water Management',
  'Renewable Energy',
  'Coastal Ecosystems',
  'Farmer Development',
  'Technology and Innovation',
]

type MediaOption = { id: string | number, name: string, url?: string, path?: string, altText?: string }

const emptyArticle = (): ArticleContent => ({
  title: '',
  summary: '',
  category: categories[0] ?? '',
  body: '',
  seoTitle: '',
  seoDescription: '',
})

function makeSlug(title: string) {
  return title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180)
}

function statusLabel(status: CmsArticle['workflow_status']) {
  return status[0]?.toUpperCase() + status.slice(1)
}

export default function ArticlesEditor({ media, canPublish, notify }: {
  media: MediaOption[]
  canPublish: boolean
  notify: (message: string) => void
}) {
  const [articles, setArticles] = useState<CmsArticle[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [content, setContent] = useState<ArticleContent>(emptyArticle)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const [previewSize, setPreviewSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [loadError, setLoadError] = useState('')
  const selectedArticle = articles.find(article => article.id === selectedId)
  const [editedArticleId, setEditedArticleId] = useState<string | null>(null)
  const currentContent = creating || editedArticleId === selectedArticle?.id
    ? content
    : selectedArticle?.draftContent ?? emptyArticle()
  const selectedMedia = useMemo(() => media.filter(asset => asset.url && asset.path), [media])

  const updateContent = (update: (current: ArticleContent) => ArticleContent) => {
    setContent(update(currentContent))
    setEditedArticleId(creating ? null : selectedArticle?.id ?? null)
  }

  const refresh = async (preferredId?: string) => {
    const loaded = await loadAdminArticles()
    setArticles(loaded)
    setLoadError('')
    const nextId = preferredId && loaded.some(article => article.id === preferredId)
      ? preferredId
      : selectedId && loaded.some(article => article.id === selectedId)
        ? selectedId
        : loaded[0]?.id ?? null
    setSelectedId(nextId)
    setEditedArticleId(null)
    setCreating(false)
  }

  useEffect(() => {
    let active = true
    loadAdminArticles().then(loaded => {
      if (!active) return
      setArticles(loaded)
      setSelectedId(loaded[0]?.id ?? null)
    }).catch(error => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Artikel Insights gagal dimuat.')
    })
    return () => { active = false }
  }, [])

  const beginNewArticle = () => {
    setSelectedId(null)
    setCreating(true)
    setContent(emptyArticle())
    setEditedArticleId(null)
    setPreview(false)
  }

  const ensureValid = () => {
    if (!currentContent.title.trim() || currentContent.title.trim().length > 180) throw new Error('Judul artikel wajib diisi (maksimal 180 karakter).')
    if (!currentContent.summary.trim() || currentContent.summary.length > 1000) throw new Error('Ringkasan artikel wajib diisi (maksimal 1.000 karakter).')
    if (!currentContent.category.trim() || currentContent.category.length > 100) throw new Error('Pilih kategori artikel yang valid.')
    if (!currentContent.body.trim() || currentContent.body.length > 30000) throw new Error('Isi artikel wajib diisi (maksimal 30.000 karakter).')
    if (currentContent.seoTitle.length > 180 || currentContent.seoDescription.length > 500) throw new Error('Panjang metadata SEO melebihi batas.')
    if (creating && !makeSlug(currentContent.title)) throw new Error('Judul tidak menghasilkan alamat artikel yang valid.')
  }

  const save = async () => {
    ensureValid()
    setBusy(true)
    try {
      let articleId: string | null = null
      if (creating) articleId = await createArticle(makeSlug(currentContent.title), currentContent)
      else if (selectedArticle) {
        await saveArticleDraft(selectedArticle.id, currentContent)
        articleId = selectedArticle.id
      }
      if (!articleId) throw new Error('Pilih atau buat artikel sebelum menyimpan.')
      await refresh(articleId)
      notify('Draft artikel berhasil disimpan')
      return articleId
    } finally {
      setBusy(false)
    }
  }

  const requestReview = async () => {
    try {
      const articleId = await save()
      await requestArticleReview(articleId)
      await refresh(articleId)
      notify('Artikel dikirim untuk ditinjau')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Artikel gagal dikirim untuk ditinjau.')
    }
  }

  const publish = async () => {
    if (!canPublish) return
    if (!window.confirm(`Publikasikan artikel “${currentContent.title}”?`)) return
    try {
      const articleId = await save()
      await publishArticle(articleId)
      await refresh(articleId)
      notify('Artikel berhasil dipublikasikan')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Artikel gagal dipublikasikan.')
    }
  }

  const archive = async () => {
    if (!canPublish || !selectedArticle || !window.confirm(`Arsipkan artikel “${currentContent.title}”?`)) return
    setBusy(true)
    try {
      await archiveArticle(selectedArticle.id)
      await refresh(selectedArticle.id)
      notify('Artikel diarsipkan')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Artikel gagal diarsipkan.')
    } finally {
      setBusy(false)
    }
  }

  const restore = async (versionId: string) => {
    if (!selectedArticle || !window.confirm('Pulihkan versi ini sebagai draft baru?')) return
    setBusy(true)
    try {
      await restoreArticleVersion(selectedArticle.id, versionId)
      await refresh(selectedArticle.id)
      notify('Versi dipulihkan sebagai draft')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Versi artikel gagal dipulihkan.')
    } finally {
      setBusy(false)
    }
  }

  const selectMedia = (path: string) => {
    const asset = selectedMedia.find(item => item.path === path)
    updateContent(current => ({
      ...current,
      heroImage: asset ? { url: asset.url ?? '', path: asset.path ?? '', altText: asset.altText ?? '' } : undefined,
    }))
  }

  return (
    <div className="library-page article-admin">
      <div className="page-heading">
        <div><p className="eyebrow">INSIGHTS</p><h1>Artikel dan Publikasi</h1><p className="field-help">Konten disimpan dalam versi draft; hanya artikel yang diterbitkan dapat dibaca publik.</p></div>
        <button className="primary-btn" onClick={beginNewArticle}><FilePlus2 size={16} /> Artikel baru</button>
      </div>
      {loadError && <section className="panel article-load-error" role="alert"><strong>Daftar artikel tidak tersedia.</strong><p>{loadError}</p><p>Pastikan migrasi CMS yang disiapkan sudah ditinjau dan diterapkan pada Supabase.</p></section>}
      <div className="article-admin-layout">
        <aside className="panel article-list">
          <div className="panel-head"><div><h2>Semua artikel</h2><p>{articles.length} artikel</p></div><button onClick={() => void refresh().catch(error => setLoadError(error instanceof Error ? error.message : 'Daftar artikel gagal dimuat.'))}><RotateCcw size={15} /></button></div>
          {articles.map(article => (
            <button type="button" className={`article-list-row ${article.id === selectedId && !creating ? 'active' : ''}`} key={article.id} onClick={() => { setSelectedId(article.id); setEditedArticleId(null); setCreating(false); setPreview(false) }}>
              <strong>{article.draftContent?.title ?? article.slug}</strong><span>/{article.slug}</span><small className={`workflow-pill ${article.workflow_status}`}>{statusLabel(article.workflow_status)}</small>
            </button>
          ))}
          {!articles.length && !loadError && <p className="dashboard-empty">Belum ada artikel.</p>}
        </aside>
        <section className="panel article-editor">
          <header className="article-editor-header">
            <div><strong>{creating ? 'Buat draft artikel' : currentContent.title || 'Pilih artikel'}</strong>{selectedArticle && <span>/{selectedArticle.slug} · {statusLabel(selectedArticle.workflow_status)}</span>}</div>
            <div className="article-actions">
              <button className="outline-btn" disabled={busy || (!creating && !selectedArticle)} onClick={() => setPreview(value => !value)}><Eye size={15} /> {preview ? 'Edit' : 'Pratinjau'}</button>
              <button className="outline-btn" disabled={busy || (!creating && !selectedArticle)} onClick={() => void save().catch(error => notify(error instanceof Error ? error.message : 'Draft artikel gagal disimpan.'))}><Save size={15} /> Simpan draft</button>
              <button className="outline-btn" disabled={busy || (!creating && !selectedArticle)} onClick={() => void requestReview()}><Eye size={15} /> Minta tinjauan</button>
              {canPublish && <button className="primary-btn" disabled={busy || (!creating && !selectedArticle)} onClick={() => void publish()}><Send size={15} /> Publikasikan</button>}
              {canPublish && selectedArticle && <button className="icon-btn" disabled={busy} title="Arsipkan artikel" onClick={() => void archive()}><Archive size={16} /></button>}
            </div>
          </header>
          {!selectedArticle && !creating ? <div className="article-empty"><FilePlus2 size={28} /><p>Pilih artikel atau buat draft baru untuk mulai.</p></div> : preview ? (
            <>
              <div className="article-preview-toolbar" aria-label="Preview viewport">
                {(['desktop', 'tablet', 'mobile'] as const).map(size => <button key={size} type="button" className={previewSize === size ? 'active' : ''} onClick={() => setPreviewSize(size)}>{size}</button>)}
              </div>
              <article className={`article-live-preview article-preview-${previewSize}`}>
                <p className="eyebrow">{currentContent.category}</p><h1>{currentContent.title || 'Untitled article'}</h1><p className="article-summary">{currentContent.summary}</p>
                {currentContent.heroImage?.url && <img src={currentContent.heroImage.url} alt={currentContent.heroImage.altText} />}
                {currentContent.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </article>
            </>
          ) : (
            <div className="article-form">
              <label>Judul<input value={currentContent.title} maxLength={180} onChange={event => updateContent(current => ({ ...current, title: event.target.value }))} /></label>
              <p className="field-help">Alamat artikel: /insights/{makeSlug(currentContent.title) || 'article-title'} (dibuat dari judul saat artikel baru dibuat)</p>
              <label>Ringkasan<textarea rows={3} value={currentContent.summary} maxLength={1000} onChange={event => updateContent(current => ({ ...current, summary: event.target.value }))} /></label>
              <label>Kategori<select value={currentContent.category} onChange={event => updateContent(current => ({ ...current, category: event.target.value }))}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
              <label>Isi artikel<textarea className="article-body-input" rows={16} value={currentContent.body} maxLength={30000} onChange={event => updateContent(current => ({ ...current, body: event.target.value }))} /><span className="field-help">Gunakan baris kosong untuk memisahkan paragraf. HTML atau JavaScript tidak didukung.</span></label>
              <label>Gambar utama
                <select value={currentContent.heroImage?.path ?? ''} onChange={event => selectMedia(event.target.value)}>
                  <option value="">Tanpa gambar utama</option>
                  {selectedMedia.map(asset => <option key={asset.id} value={asset.path}>{asset.name}</option>)}
                </select>
              </label>
              {currentContent.heroImage && <label>Teks alternatif gambar<input maxLength={500} value={currentContent.heroImage.altText} onChange={event => updateContent(current => current.heroImage ? { ...current, heroImage: { ...current.heroImage, altText: event.target.value } } : current)} /></label>}
              <div className="article-seo-fields"><h3>SEO</h3>
                <label>SEO title<input maxLength={180} value={currentContent.seoTitle} onChange={event => updateContent(current => ({ ...current, seoTitle: event.target.value }))} /></label>
                <label>SEO description<textarea rows={3} maxLength={500} value={currentContent.seoDescription} onChange={event => updateContent(current => ({ ...current, seoDescription: event.target.value }))} /></label>
              </div>
              {selectedArticle && <section className="article-history"><h3><History size={15} /> Riwayat versi</h3>
                {selectedArticle.versions.map(version => <div className="article-version-row" key={version.id}>
                  <span>Versi {version.version_number} · {new Date(version.created_at).toLocaleString('id-ID')}{version.published_at ? ' · diterbitkan' : ''}</span>
                  <button className="text-btn" disabled={busy || version.id === selectedArticle.draft_version_id} onClick={() => void restore(version.id)}>Pulihkan</button>
                </div>)}
              </section>}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
