import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import type { PublicPageBlock } from '../lib/content-model'

const iconOptions = [
  { value: 'leaf', label: 'Leaf' },
  { value: 'waves', label: 'Waves' },
  { value: 'sun', label: 'Sun' },
  { value: 'users', label: 'People' },
  { value: 'grid', label: 'Network' },
  { value: 'search', label: 'Monitoring' },
  { value: 'settings', label: 'Engineering' },
  { value: 'wind', label: 'Wind' },
]

export default function ContentBlocksEditor({ blocks, onChange }: {
  blocks: PublicPageBlock[]
  onChange: (blocks: PublicPageBlock[]) => void
}) {
  const updateAt = (index: number, update: (block: PublicPageBlock) => PublicPageBlock) => {
    onChange(blocks.map((block, i) => i === index ? update(block) : block))
  }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return
    const reordered = [...blocks]
    const [item] = reordered.splice(from, 1)
    if (item) reordered.splice(to, 0, item)
    onChange(reordered)
  }
  const addBlock = (type: 'story' | 'cards' | 'list' | 'business-model' | 'impact' | 'categories') => {
    const id = `custom-${crypto.randomUUID()}`
    const newBlock: PublicPageBlock = type === 'story'
      ? { id, type, title: 'New story section', paragraphs: ['Add approved text here.'] }
      : type === 'cards'
        ? { id, type, title: 'New card section', cards: [{ title: 'New card', description: '', icon: 'leaf' }] }
        : type === 'list'
          ? { id, type, title: 'New list section', items: ['Add an item'] }
          : type === 'business-model'
            ? { id, type, title: 'New business model section', layers: [], revenueSources: [], note: '' }
            : type === 'impact'
              ? { id, type, title: 'New impact section', groups: [], note: '' }
              : { id, type, title: 'New categories section', description: '', categories: [] }
    onChange([...blocks, newBlock])
  }

  return (
    <div className="library-page">
      <div className="page-heading">
        <div><p className="eyebrow">PUBLIC CONTENT</p><h1>Text and Content Blocks</h1><p className="field-help">Edits are saved as a page draft. Publish only after review.</p></div>
        <div className="content-block-add">
          <button className="outline-btn" onClick={() => addBlock('story')}><Plus size={15} /> Story</button>
          <button className="outline-btn" onClick={() => addBlock('cards')}><Plus size={15} /> Cards</button>
          <button className="outline-btn" onClick={() => addBlock('list')}><Plus size={15} /> List</button>
          <button className="outline-btn" onClick={() => addBlock('business-model')}><Plus size={15} /> Business model</button>
          <button className="outline-btn" onClick={() => addBlock('impact')}><Plus size={15} /> Impact</button>
          <button className="outline-btn" onClick={() => addBlock('categories')}><Plus size={15} /> Categories</button>
        </div>
      </div>
      {!blocks.length && <section className="panel content-block-empty"><p>No content blocks yet. Add a story, cards, or list section.</p></section>}
      <div className="content-block-editor-list">
        {blocks.map((block, index) => (
          <article className={`panel content-block-editor ${block.visible === false ? 'is-hidden' : ''}`} key={block.id}>
            <header>
              <div><span>Block {index + 1}</span><strong>{block.title || 'Untitled block'}</strong></div>
              <div className="content-block-actions">
                <button className="icon-btn" title="Move up" aria-label="Move block up" disabled={index === 0} onClick={() => move(index, index - 1)}><ChevronUp size={16} /></button>
                <button className="icon-btn" title="Move down" aria-label="Move block down" disabled={index === blocks.length - 1} onClick={() => move(index, index + 1)}><ChevronDown size={16} /></button>
                <button className="icon-btn" title={block.visible === false ? 'Show block' : 'Hide block'} onClick={() => updateAt(index, current => ({ ...current, visible: current.visible === false }))}>{block.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                <button className="icon-btn" title="Delete block" onClick={() => onChange(blocks.filter((_, i) => i !== index))}><Trash2 size={16} /></button>
              </div>
            </header>
            <div className="content-block-common">
              <label>Block title<input value={block.title} maxLength={180} onChange={event => updateAt(index, current => ({ ...current, title: event.target.value }))} /></label>
              {'eyebrow' in block && <label>Eyebrow<input value={block.eyebrow ?? ''} maxLength={100} onChange={event => updateAt(index, current => 'eyebrow' in current ? { ...current, eyebrow: event.target.value } : current)} /></label>}
              <label>Background
                <select value={block.background ?? 'sand'} onChange={event => updateAt(index, current => ({ ...current, background: event.target.value as NonNullable<PublicPageBlock['background']> }))}>
                  <option value="sand">Natural sand</option><option value="white">White</option><option value="mint">Mangrove green</option><option value="ocean">Deep ocean green</option>
                </select>
              </label>
              <label>Alignment
                <select value={block.alignment ?? 'left'} onChange={event => updateAt(index, current => ({ ...current, alignment: event.target.value as NonNullable<PublicPageBlock['alignment']> }))}>
                  <option value="left">Left</option><option value="centre">Centre</option>
                </select>
              </label>
            </div>
            {'description' in block && <label className="content-block-description">Section description<textarea rows={3} value={block.description ?? ''} maxLength={2000} onChange={event => updateAt(index, current => 'description' in current ? { ...current, description: event.target.value } : current)} /></label>}
            {block.type === 'story' && (
              <StringListEditor
                label="Paragraphs"
                values={block.paragraphs}
                onChange={paragraphs => updateAt(index, current => current.type === 'story' ? { ...current, paragraphs } : current)}
              />
            )}
            {block.type === 'cards' && (
              <div className="content-block-nested">
                <div className="content-block-nested-heading"><h3>Cards</h3><button className="outline-btn" onClick={() => updateAt(index, current => current.type === 'cards' ? { ...current, cards: [...current.cards, { title: 'New card', description: '', icon: 'leaf' }] } : current)}><Plus size={14} /> Add card</button></div>
                {block.cards.map((card, cardIndex) => (
                  <section className="content-block-item" key={`${block.id}-card-${cardIndex}`}>
                    <div className="content-block-item-heading"><strong>Card {cardIndex + 1}</strong><button className="icon-btn" title="Remove card" onClick={() => updateAt(index, current => current.type === 'cards' ? { ...current, cards: current.cards.filter((_, i) => i !== cardIndex) } : current)}><Trash2 size={15} /></button></div>
                    <label>Title<input value={card.title} maxLength={180} onChange={event => updateAt(index, current => current.type === 'cards' ? { ...current, cards: current.cards.map((item, i) => i === cardIndex ? { ...item, title: event.target.value } : item) } : current)} /></label>
                    <label>Subtitle<input value={card.subtitle ?? ''} maxLength={180} onChange={event => updateAt(index, current => current.type === 'cards' ? { ...current, cards: current.cards.map((item, i) => i === cardIndex ? { ...item, subtitle: event.target.value } : item) } : current)} /></label>
                    <label>Description<textarea rows={3} value={card.description} maxLength={2000} onChange={event => updateAt(index, current => current.type === 'cards' ? { ...current, cards: current.cards.map((item, i) => i === cardIndex ? { ...item, description: event.target.value } : item) } : current)} /></label>
                    <label>Icon<select value={card.icon} onChange={event => updateAt(index, current => current.type === 'cards' ? { ...current, cards: current.cards.map((item, i) => i === cardIndex ? { ...item, icon: event.target.value } : item) } : current)}>{iconOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
                    <label>CTA destination<input value={card.href ?? ''} maxLength={500} placeholder="/contact" onChange={event => updateAt(index, current => current.type === 'cards' ? { ...current, cards: current.cards.map((item, i) => i === cardIndex ? { ...item, href: event.target.value } : item) } : current)} /></label>
                    <label>CTA text<input value={card.ctaLabel ?? ''} maxLength={100} onChange={event => updateAt(index, current => current.type === 'cards' ? { ...current, cards: current.cards.map((item, i) => i === cardIndex ? { ...item, ctaLabel: event.target.value } : item) } : current)} /></label>
                  </section>
                ))}
              </div>
            )}
            {block.type === 'list' && (
              <StringListEditor label="List items" values={block.items} onChange={items => updateAt(index, current => current.type === 'list' ? { ...current, items } : current)} />
            )}
            {block.type === 'business-model' && (
              <div className="content-block-nested">
                <h3>Economic layers</h3>
                {block.layers.map((layer, layerIndex) => (
                  <section className="content-block-item" key={`${block.id}-layer-${layerIndex}`}>
                    <div className="content-block-item-heading"><strong>Layer {layerIndex + 1}</strong><button className="icon-btn" title="Remove layer" onClick={() => updateAt(index, current => current.type === 'business-model' ? { ...current, layers: current.layers.filter((_, i) => i !== layerIndex) } : current)}><Trash2 size={15} /></button></div>
                    <label>Title<input value={layer.title} maxLength={180} onChange={event => updateAt(index, current => current.type === 'business-model' ? { ...current, layers: current.layers.map((item, i) => i === layerIndex ? { ...item, title: event.target.value } : item) } : current)} /></label>
                    <label>Description<textarea rows={3} value={layer.description} maxLength={2000} onChange={event => updateAt(index, current => current.type === 'business-model' ? { ...current, layers: current.layers.map((item, i) => i === layerIndex ? { ...item, description: event.target.value } : item) } : current)} /></label>
                  </section>
                ))}
                <button className="outline-btn" onClick={() => updateAt(index, current => current.type === 'business-model' ? { ...current, layers: [...current.layers, { title: '', description: '' }] } : current)}><Plus size={14} /> Add layer</button>
                <StringListEditor label="Potential revenue sources" values={block.revenueSources} onChange={revenueSources => updateAt(index, current => current.type === 'business-model' ? { ...current, revenueSources } : current)} />
                <label>Disclosure note<textarea rows={4} value={block.note} maxLength={3000} onChange={event => updateAt(index, current => current.type === 'business-model' ? { ...current, note: event.target.value } : current)} /></label>
              </div>
            )}
            {block.type === 'impact' && (
              <div className="content-block-nested">
                <div className="content-block-nested-heading"><h3>Impact groups</h3><button className="outline-btn" onClick={() => updateAt(index, current => current.type === 'impact' ? { ...current, groups: [...current.groups, { title: '', icon: 'leaf', items: [] }] } : current)}><Plus size={14} /> Add group</button></div>
                {block.groups.map((group, groupIndex) => (
                  <section className="content-block-item" key={`${block.id}-group-${groupIndex}`}>
                    <div className="content-block-item-heading"><strong>Group {groupIndex + 1}</strong><button className="icon-btn" title="Remove group" onClick={() => updateAt(index, current => current.type === 'impact' ? { ...current, groups: current.groups.filter((_, i) => i !== groupIndex) } : current)}><Trash2 size={15} /></button></div>
                    <label>Title<input value={group.title} maxLength={180} onChange={event => updateAt(index, current => current.type === 'impact' ? { ...current, groups: current.groups.map((item, i) => i === groupIndex ? { ...item, title: event.target.value } : item) } : current)} /></label>
                    <label>Icon<select value={group.icon} onChange={event => updateAt(index, current => current.type === 'impact' ? { ...current, groups: current.groups.map((item, i) => i === groupIndex ? { ...item, icon: event.target.value } : item) } : current)}>{iconOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
                    <StringListEditor label="Indicators" values={group.items} onChange={items => updateAt(index, current => current.type === 'impact' ? { ...current, groups: current.groups.map((item, i) => i === groupIndex ? { ...item, items } : item) } : current)} />
                  </section>
                ))}
                <label>Disclosure note<textarea rows={3} value={block.note} maxLength={3000} onChange={event => updateAt(index, current => current.type === 'impact' ? { ...current, note: event.target.value } : current)} /></label>
              </div>
            )}
            {block.type === 'categories' && (
              <StringListEditor label="Categories" values={block.categories} onChange={categories => updateAt(index, current => current.type === 'categories' ? { ...current, categories } : current)} />
            )}
            {'note' in block && block.type === 'list' && <label className="content-block-description">Disclosure note<textarea rows={3} value={block.note ?? ''} maxLength={3000} onChange={event => updateAt(index, current => current.type === 'list' ? { ...current, note: event.target.value } : current)} /></label>}
          </article>
        ))}
      </div>
    </div>
  )
}

function StringListEditor({ label, values, onChange }: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
}) {
  return (
    <div className="content-block-nested">
      <div className="content-block-nested-heading"><h3>{label}</h3><button className="outline-btn" onClick={() => onChange([...values, ''])}><Plus size={14} /> Add item</button></div>
      {values.map((value, index) => (
        <label className="content-block-list-item" key={`${label}-${index}`}>
          <span>{index + 1}</span>
          <textarea rows={2} value={value} maxLength={2000} onChange={event => onChange(values.map((item, i) => i === index ? event.target.value : item))} />
          <button className="icon-btn" title="Remove item" onClick={() => onChange(values.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
        </label>
      ))}
    </div>
  )
}
