import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react'
import { Language, NovelSummary, Theme } from '../types'
import { WORKFLOW_COPY } from '../lib/i18n'
import { createEmptyNovel, listNovelSummaries, restoreNovel } from '../lib/novels'

interface Props {
  theme: Theme
  lang: Language
  onOpenNovel: (id: string) => void
  onSignOut: () => Promise<void>
}

type Tab = 'active' | 'archived'

const LANG_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
]

export default function NovelLibrary({ theme, lang, onOpenNovel, onSignOut }: Props) {
  const copy = WORKFLOW_COPY[lang]
  const [tab, setTab] = useState<Tab>('active')
  const [activeNovels, setActiveNovels] = useState<NovelSummary[]>([])
  const [archivedNovels, setArchivedNovels] = useState<NovelSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState<string>(lang)
  const [error, setError] = useState('')

  const currentNovels = tab === 'active' ? activeNovels : archivedNovels

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    background: theme.modal.inputBg,
    border: '1px solid ' + theme.modal.border,
    borderRadius: 7,
    color: theme.modal.text,
    fontFamily: theme.font.body,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [active, archived] = await Promise.all([
        listNovelSummaries(false),
        listNovelSummaries(true),
      ])
      setActiveNovels(active)
      setArchivedNovels(archived)
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.states.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const create = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const novelId = await createEmptyNovel(title || copy.library.untitledNovel, sourceLanguage)
      setShowCreate(false)
      setTitle('')
      onOpenNovel(novelId)
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.states.error)
    } finally {
      setSaving(false)
    }
  }

  const restore = async (id: string) => {
    setSaving(true)
    setError('')
    try {
      await restoreNovel(id)
      await load()
      setTab('active')
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.states.error)
    } finally {
      setSaving(false)
    }
  }

  const emptyLabel = tab === 'active' ? copy.library.empty : copy.library.archivedEmpty
  const tabButton = (id: Tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '7px 12px',
        borderRadius: 7,
        border: '1px solid ' + (tab === id ? theme.accent + '66' : theme.panel.border),
        background: tab === id ? theme.accent + '18' : 'transparent',
        color: tab === id ? theme.accent : theme.panel.textMuted,
        cursor: 'pointer',
        fontFamily: theme.font.body,
        fontSize: 12,
      }}
    >
      {label}
    </button>
  )

  const formatted = useMemo(() => new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : lang, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }), [lang])

  return (
    <div style={{ minHeight: '100vh', background: theme.app.bg, color: theme.app.text, fontFamily: theme.font.body }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 18px', background: theme.sidebar.bg, borderBottom: '1px solid ' + theme.sidebar.border }}>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15 }}>&#10022; {copy.library.title}</div>
        <div style={{ flex: 1 }} />
        <button onClick={() => void onSignOut()} style={{ border: '1px solid ' + theme.sidebar.border, background: 'transparent', color: theme.sidebar.textMuted, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: theme.font.body, fontSize: 12 }}>{copy.library.signOut}</button>
      </div>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '28px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: theme.panel.textMuted, marginBottom: 3 }}>{copy.library.title}</div>
            <h1 style={{ margin: 0, fontFamily: theme.font.heading, fontSize: 24, lineHeight: 1.2 }}>{tab === 'active' ? copy.library.active : copy.library.archived}</h1>
          </div>
          <div style={{ flex: 1 }} />
          {tabButton('active', copy.library.active)}
          {tabButton('archived', copy.library.archived)}
          <button onClick={() => setShowCreate(true)} style={{ padding: '8px 13px', border: 'none', borderRadius: 7, background: theme.accent, color: '#fff', cursor: 'pointer', fontFamily: theme.font.body, fontWeight: 700, fontSize: 12 }}>{copy.library.newNovel}</button>
        </div>

        {error && <div style={{ color: '#C0392B', background: '#fdecea', borderRadius: 7, padding: '9px 11px', fontSize: 12, marginBottom: 14 }}>{error}</div>}

        <div style={{ border: '1px solid ' + theme.panel.border, borderRadius: 10, overflow: 'hidden', background: theme.panel.bg }}>
          {loading ? (
            <div style={{ padding: 24, color: theme.panel.textMuted, fontSize: 13 }}>{copy.states.loading}</div>
          ) : currentNovels.length === 0 ? (
            <div style={{ padding: 24, color: theme.panel.textMuted, fontSize: 13 }}>{emptyLabel}</div>
          ) : (
            currentNovels.map(novel => (
              <div key={novel.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid ' + theme.panel.border }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 16, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{novel.title}</div>
                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 10, color: theme.panel.textMuted, fontSize: 11 }}>
                    <span>{copy.library.updated}: {formatted.format(new Date(novel.updatedAt))}</span>
                    <span>{novel.chapterCount} {copy.library.chapters}</span>
                    <span>{novel.totalWords.toLocaleString()} {copy.library.words}</span>
                    <span>{novel.sourceLanguage}</span>
                    {tab === 'archived' && novel.purgeAfter && <span>{copy.library.purgeAfter}: {formatted.format(new Date(novel.purgeAfter))}</span>}
                  </div>
                </div>
                {tab === 'active' ? (
                  <button onClick={() => onOpenNovel(novel.id)} style={{ padding: '7px 12px', border: '1px solid ' + theme.accent, background: theme.accent + 'ee', color: '#fff', borderRadius: 7, cursor: 'pointer', fontFamily: theme.font.body, fontSize: 12 }}>{copy.library.open}</button>
                ) : (
                  <button disabled={saving} onClick={() => void restore(novel.id)} style={{ padding: '7px 12px', border: '1px solid ' + theme.accent, background: 'transparent', color: theme.accent, borderRadius: 7, cursor: 'pointer', fontFamily: theme.font.body, fontSize: 12 }}>{copy.library.restore}</button>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <form onSubmit={create} style={{ width: 420, background: theme.modal.bg, border: '1px solid ' + theme.modal.border, borderRadius: 14, overflow: 'hidden', color: theme.modal.text }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + theme.modal.border, background: theme.modal.headerBg, fontFamily: theme.font.heading, fontWeight: 700 }}>{copy.library.newNovel}</div>
            <div style={{ padding: 20 }}>
              <label style={{ display: 'block', marginBottom: 13 }}>
                <span style={{ display: 'block', fontSize: 11, color: theme.modal.textMuted, marginBottom: 5 }}>{copy.library.novelTitle}</span>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder={copy.library.untitledNovel} style={inputStyle} />
              </label>
              <label style={{ display: 'block', marginBottom: 13 }}>
                <span style={{ display: 'block', fontSize: 11, color: theme.modal.textMuted, marginBottom: 5 }}>{copy.library.sourceLanguage}</span>
                <select value={sourceLanguage} onChange={e => setSourceLanguage(e.target.value)} style={inputStyle}>
                  {LANG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </label>
              <div style={{ fontSize: 12, color: theme.modal.textMuted, lineHeight: 1.6, marginBottom: 14 }}>{copy.library.blankAiNote}</div>
              <button disabled={saving} style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: 7, background: theme.accent, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: theme.font.body, fontWeight: 700 }}>{copy.library.create}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
