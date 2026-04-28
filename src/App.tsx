import { useEffect, useMemo, useRef, useState } from 'react'
import { Character, Chapter, ChapterStatus, Language, Novel, NovelNote, Theme } from './types'
import { THEMES } from './lib/themes'
import { STATUS_LABELS, TRANSLATIONS, WORKFLOW_COPY } from './lib/i18n'
import { CHAR_COLORS } from './lib/data'
import { useSettings } from './hooks/useSettings'
import { useAuth } from './hooks/useAuth'
import { useSingleEditorTab } from './hooks/useSingleEditorTab'
import {
  addChapter as createChapter,
  archiveNovel,
  getAIUsage,
  loadNovelWorkspace,
  updateChapter,
  updateNote,
  updateNovelMeta,
  upsertCharacter,
} from './lib/novels'
import { AIUsage, AppSettings } from './types'
import Sidebar from './components/Sidebar'
import AIPanel from './components/AIPanel'
import CharacterModal from './components/CharacterModal'
import ProgressPanel from './components/ProgressPanel'
import SettingsPanel from './components/SettingsPanel'
import AuthGate from './components/AuthGate'
import NovelLibrary from './components/NovelLibrary'

const ACTIVE_NOVEL_KEY = 'novel-studio-active-novel'

function IGear() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M6.5 1h2l.5 1.5a4 4 0 011.1.65l1.5-.5 1 1.73-1.2 1a4 4 0 010 1.24l1.2 1-1 1.73-1.5-.5A4 4 0 019 9.5L8.5 11h-2L6 9.5a4 4 0 01-1.1-.65l-1.5.5-1-1.73 1.2-1a4 4 0 010-1.24l-1.2-1 1-1.73 1.5.5A4 4 0 016 2.5L6.5 1z" stroke="currentColor" strokeWidth="1.1"/><circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/></svg> }

function TBtn({ label, onClick, theme, active }: { label: string; onClick: () => void; theme: Theme; active?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '4px 11px', background: active ? theme.accent + '22' : hov ? theme.sidebar.border + '88' : 'transparent', border: active ? '1px solid ' + theme.accent + '55' : '1px solid transparent', borderRadius: 6, cursor: 'pointer', color: active ? theme.accent : theme.sidebar.text, fontSize: 12, fontFamily: theme.font.body, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )
}

function LoadingShell({ theme, label }: { theme: Theme; label: string }) {
  return (
    <div style={{ minHeight: '100vh', background: theme.app.bg, color: theme.app.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.font.body, fontSize: 13 }}>
      {label}
    </div>
  )
}

export default function App() {
  const [settings, setSetting] = useSettings()
  const theme = THEMES[settings.variant] || THEMES.parchment
  const auth = useAuth()
  const copy = WORKFLOW_COPY[settings.lang]
  const [activeNovelId, setActiveNovelId] = useState<string | null>(() => localStorage.getItem(ACTIVE_NOVEL_KEY))
  const [path, setPath] = useState(() => window.location.pathname)
  const isPasswordResetRoute = path === '/update-password'

  useEffect(() => {
    if (!auth.session) {
      setActiveNovelId(null)
      localStorage.removeItem(ACTIVE_NOVEL_KEY)
    }
  }, [auth.session])

  const openNovel = (id: string) => {
    localStorage.setItem(ACTIVE_NOVEL_KEY, id)
    setActiveNovelId(id)
  }

  const backToLibrary = () => {
    localStorage.removeItem(ACTIVE_NOVEL_KEY)
    setActiveNovelId(null)
  }

  const signOut = async () => {
    localStorage.removeItem(ACTIVE_NOVEL_KEY)
    setActiveNovelId(null)
    await auth.signOut()
  }

  if (auth.loading) return <LoadingShell theme={theme} label={copy.states.loading} />

  const finishPasswordReset = () => {
    localStorage.removeItem(ACTIVE_NOVEL_KEY)
    setActiveNovelId(null)
    window.history.replaceState(null, '', '/')
    setPath('/')
  }

  if (!auth.session || isPasswordResetRoute) {
    return (
      <AuthGate
        theme={theme}
        lang={settings.lang}
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
        onResetPassword={auth.requestPasswordReset}
        onUpdatePassword={auth.updatePassword}
        onPasswordUpdated={finishPasswordReset}
      />
    )
  }

  if (!activeNovelId) {
    return <NovelLibrary theme={theme} lang={settings.lang} onOpenNovel={openNovel} onSignOut={signOut} />
  }

  return (
    <EditorWorkspace
      novelId={activeNovelId}
      theme={theme}
      settings={settings}
      setSetting={setSetting}
      onBackToLibrary={backToLibrary}
      onSignOut={signOut}
      onPasswordUpdate={auth.updatePassword}
    />
  )
}

interface EditorWorkspaceProps {
  novelId: string
  theme: Theme
  settings: AppSettings
  setSetting: (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => void
  onBackToLibrary: () => void
  onSignOut: () => Promise<void>
  onPasswordUpdate: (password: string, currentPassword?: string) => Promise<void>
}

function EditorWorkspace({ novelId, theme, settings, setSetting, onBackToLibrary, onSignOut, onPasswordUpdate }: EditorWorkspaceProps) {
  const t = useMemo(() => TRANSLATIONS[settings.lang] || TRANSLATIONS.en, [settings.lang])
  const copy = WORKFLOW_COPY[settings.lang]
  const tabBlocked = useSingleEditorTab(novelId)

  const [novel, setNovel] = useState<Novel | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [notes, setNotes] = useState<NovelNote[]>([])
  const [activeChapterId, setActiveChapterId] = useState('')
  const [activeNoteId, setActiveNoteId] = useState('')
  const [aiOpen, setAiOpen] = useState(settings.showAI)
  const [selectedText, setSelectedText] = useState('')
  const [charModal, setCharModal] = useState<Character | 'new' | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [saved, setSaved] = useState(true)
  const [saveError, setSaveError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [aiUsage, setAIUsage] = useState<AIUsage | null>(null)
  const [floatingMenu, setFloatingMenu] = useState<{ x: number; y: number } | null>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setAiOpen(settings.showAI) }, [settings.showAI])

  useEffect(() => {
    if (tabBlocked) return
    let mounted = true
    setLoading(true)
    setLoadError('')
    loadNovelWorkspace(novelId)
      .then(workspace => {
        if (!mounted) return
        setNovel(workspace.novel)
        setChapters(workspace.chapters)
        setCharacters(workspace.characters)
        setNotes(workspace.notes)
        setActiveChapterId(workspace.chapters[0]?.id || '')
        setActiveNoteId(workspace.notes[0]?.id || '')
        setSaved(true)
      })
      .catch(err => {
        if (!mounted) return
        setLoadError(err instanceof Error ? err.message : copy.states.error)
      })
      .finally(() => mounted && setLoading(false))

    getAIUsage().then(setAIUsage).catch(() => undefined)

    return () => {
      mounted = false
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current)
    }
  }, [copy.states.error, novelId, tabBlocked])

  const activeChapter = chapters.find(c => c.id === activeChapterId)

  const scheduleChapterSave = (chapter: Chapter) => {
    setSaved(false)
    setSaveError('')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      updateChapter(chapter)
        .then(() => setSaved(true))
        .catch(err => {
          setSaveError(err instanceof Error ? err.message : copy.states.error)
          setSaved(false)
        })
    }, 900)
  }

  const persistChapterNow = (chapter: Chapter) => {
    setSaved(false)
    setSaveError('')
    updateChapter(chapter)
      .then(() => setSaved(true))
      .catch(err => {
        setSaveError(err instanceof Error ? err.message : copy.states.error)
        setSaved(false)
      })
  }

  const scheduleNoteSave = (note: NovelNote) => {
    setSaved(false)
    setSaveError('')
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current)
    noteTimerRef.current = setTimeout(() => {
      updateNote(note)
        .then(() => setSaved(true))
        .catch(err => {
          setSaveError(err instanceof Error ? err.message : copy.states.error)
          setSaved(false)
        })
    }, 900)
  }

  const updateContent = (val: string) => {
    let nextChapter: Chapter | undefined
    setChapters(prev => prev.map(c => {
      if (c.id !== activeChapterId) return c
      nextChapter = { ...c, content: val, wordCount: val.replace(/\s/g, '').length }
      return nextChapter
    }))
    if (nextChapter) scheduleChapterSave(nextChapter)
  }

  const handleInsert = (text: string) => {
    const ta = editorRef.current
    if (!ta) return
    const ss = ta.selectionStart, ee = ta.selectionEnd
    const cur = activeChapter ? activeChapter.content : ''
    updateContent(cur.slice(0, ss) + '\n\n' + text + '\n\n' + cur.slice(ee))
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = ss + text.length + 4; ta.focus() }, 50)
  }

  const handleSelect = () => {
    const ta = editorRef.current
    if (!ta) return
    const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd)
    if (sel && sel.trim().length > 5) {
      setSelectedText(sel)
      const rect = ta.getBoundingClientRect()
      setFloatingMenu({ x: rect.left + 60, y: rect.top + 60 })
    } else {
      setFloatingMenu(null)
      if (!sel) setSelectedText('')
    }
  }

  const addChapter = () => {
    const sortOrder = chapters.reduce((max, chapter) => Math.max(max, chapter.sortOrder || 0), 0) + 10
    createChapter(novelId, '第 ' + (chapters.length + 1) + ' 章', sortOrder)
      .then(chapter => {
        setChapters(prev => [...prev, chapter])
        setActiveChapterId(chapter.id)
      })
      .catch(err => setSaveError(err instanceof Error ? err.message : copy.states.error))
  }

  const saveCharacter = (char: Character) => {
    const existingIdx = characters.findIndex(c => c.id === char.id)
    const finalChar = {
      ...char,
      color: char.color || CHAR_COLORS[Math.max(0, existingIdx) % CHAR_COLORS.length],
      sortOrder: char.sortOrder ?? (existingIdx >= 0 ? characters[existingIdx].sortOrder : (characters.length + 1) * 10),
    }
    setCharacters(prev => {
      const idx = prev.findIndex(c => c.id === finalChar.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = finalChar; return next }
      return [...prev, finalChar]
    })
    upsertCharacter(novelId, finalChar, finalChar.sortOrder)
      .then(() => setSaved(true))
      .catch(err => setSaveError(err instanceof Error ? err.message : copy.states.error))
  }

  const wrapSel = (before: string, after: string) => {
    const ta = editorRef.current
    if (!ta) return
    const ss = ta.selectionStart, ee = ta.selectionEnd
    const cur = activeChapter ? activeChapter.content : ''
    updateContent(cur.slice(0, ss) + before + cur.slice(ss, ee) + after + cur.slice(ee))
  }

  const updateStatus = (status: ChapterStatus) => {
    let updated: Chapter | undefined
    setChapters(prev => prev.map(c => {
      if (c.id !== activeChapterId) return c
      updated = { ...c, status }
      return updated
    }))
    if (updated) persistChapterNow(updated)
  }

  const changeNote = (id: string, content: string) => {
    let updated: NovelNote | undefined
    setNotes(prev => prev.map(note => {
      if (note.id !== id) return note
      updated = { ...note, content }
      return updated
    }))
    if (updated) scheduleNoteSave(updated)
  }

  const updateNovelSettings = async (values: { title: string; sourceLanguage: string }) => {
    if (!novel) return
    const next = { ...novel, title: values.title, sourceLanguage: values.sourceLanguage }
    setNovel(next)
    await updateNovelMeta(novel.id, values)
  }

  const archiveCurrentNovel = async () => {
    if (!novel) return
    await archiveNovel(novel.id)
    onBackToLibrary()
  }

  const ed = theme.editor
  const isDark = settings.variant === 'midnight'
  const toggleTheme = () => setSetting('variant', isDark ? 'parchment' : 'midnight')
  const statusOpts: ChapterStatus[] = ['draft', 'writing', 'done']
  const editorPlaceholder = t.editorPlaceholder.replace('{title}', activeChapter ? activeChapter.title : '')
  const saveLabel = saveError ? copy.states.error : saved ? t.saved : t.saving

  if (tabBlocked) {
    return (
      <div style={{ minHeight: '100vh', background: theme.app.bg, color: theme.app.text, fontFamily: theme.font.body, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 360, background: theme.modal.bg, border: '1px solid ' + theme.modal.border, borderRadius: 12, padding: 20 }}>
          <div style={{ color: theme.modal.text, marginBottom: 12, lineHeight: 1.6 }}>{copy.states.multiTabBlocked}</div>
          <button onClick={onBackToLibrary} style={{ padding: '8px 12px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>{copy.states.back}</button>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingShell theme={theme} label={copy.states.loading} />

  if (loadError || !novel) {
    return (
      <div style={{ minHeight: '100vh', background: theme.app.bg, color: theme.app.text, fontFamily: theme.font.body, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 360, background: theme.modal.bg, border: '1px solid ' + theme.modal.border, borderRadius: 12, padding: 20 }}>
          <div style={{ color: '#C0392B', marginBottom: 12 }}>{loadError || copy.states.error}</div>
          <button onClick={onBackToLibrary} style={{ padding: '8px 12px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>{copy.states.back}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: theme.app.bg, color: theme.app.text, transition: 'background 0.3s,color 0.3s' }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 16px', background: theme.sidebar.bg, borderBottom: '1px solid ' + theme.sidebar.border, gap: 8, flexShrink: 0 }}>
        <button onClick={onBackToLibrary} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid ' + theme.sidebar.border, borderRadius: 6, cursor: 'pointer', color: theme.sidebar.textMuted, fontSize: 12, fontFamily: theme.font.body }}>{copy.states.back}</button>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15, letterSpacing: '0.02em' }}>&#10022; {t.appTitle}</div>
        <div style={{ flex: 1 }} />
        <select value={activeChapter ? activeChapter.status : 'draft'}
          onChange={e => updateStatus(e.target.value as ChapterStatus)}
          style={{ padding: '3px 8px', background: 'transparent', border: '1px solid ' + theme.sidebar.border, borderRadius: 5, fontSize: 12, color: theme.app.text, fontFamily: theme.font.body, cursor: 'pointer' }}>
          {statusOpts.map(status => <option key={status} value={status}>{STATUS_LABELS[settings.lang][status]}</option>)}
        </select>
        <select value={settings.lang} onChange={e => setSetting('lang', e.target.value as Language)}
          style={{ padding: '3px 8px', background: 'transparent', border: '1px solid ' + theme.sidebar.border, borderRadius: 5, fontSize: 12, color: theme.app.text, fontFamily: theme.font.body, cursor: 'pointer' }}>
          <option value="zh-TW">繁體</option>
          <option value="zh-CN">简体</option>
          <option value="en">EN</option>
        </select>
        <button onClick={toggleTheme} title={isDark ? 'Switch to warm' : '切換深色'}
          style={{ width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid ' + theme.sidebar.border, borderRadius: 6, cursor: 'pointer', color: theme.sidebar.text, fontSize: 15, transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = theme.sidebar.border + '88'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
        >{isDark ? '☀' : '◑'}</button>
        <TBtn label={t.progress} onClick={() => setShowProgress(true)} theme={theme} />
        <TBtn label={t.addChar} onClick={() => setCharModal('new')} theme={theme} />
        <TBtn label={aiOpen ? t.aiOff : t.aiOn} onClick={() => setAiOpen(v => !v)} theme={theme} active={aiOpen} />
        <button onClick={() => setShowSettings(v => !v)}
          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showSettings ? theme.accent + '22' : 'transparent', border: showSettings ? '1px solid ' + theme.accent + '55' : '1px solid transparent', borderRadius: 6, cursor: 'pointer', color: showSettings ? theme.accent : theme.sidebar.textMuted, transition: 'all 0.15s' }}
          onMouseEnter={e => { if (!showSettings) (e.currentTarget as HTMLButtonElement).style.background = theme.sidebar.border + '88' }}
          onMouseLeave={e => { if (!showSettings) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        ><IGear /></button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          theme={theme}
          t={t}
          lang={settings.lang}
          novelTitle={novel.title}
          chapters={chapters}
          characters={characters}
          notes={notes}
          activeChapterId={activeChapterId}
          activeNoteId={activeNoteId}
          onSelectChapter={setActiveChapterId}
          onAddChapter={addChapter}
          onSelectNote={setActiveNoteId}
          onNoteChange={changeNote}
          onSelectCharacter={setCharModal}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: ed.bg, transition: 'background 0.3s' }}>
          <div style={{ height: 38, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 4, background: ed.toolbarBg, borderBottom: '1px solid ' + ed.border, flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontFamily: theme.font.heading, fontWeight: 600, marginRight: 8 }}>{activeChapter ? activeChapter.title : ''}</span>
            <div style={{ width: 1, height: 16, background: ed.border, margin: '0 6px' }} />
            {([[t.bold, '**', '**'], [t.italic, '_', '_'], [t.quote, '\n「', '」\n']] as [string, string, string][]).map(([l, b, a]) => (
              <button key={l} onClick={() => wrapSel(b, a)} style={{ padding: '3px 8px', background: 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: ed.textMuted, fontSize: 11, fontFamily: theme.font.body }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = ed.border + '66'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
              >{l}</button>
            ))}
            <div style={{ flex: 1 }} />
            <span title={saveError} style={{ fontSize: 11, color: saveError ? '#C0392B' : ed.textMuted }}>{saveLabel}</span>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '40px 0' }}>
            <textarea
              ref={editorRef}
              value={activeChapter ? activeChapter.content : ''}
              onChange={e => updateContent(e.target.value)}
              onSelect={handleSelect}
              onMouseUp={handleSelect}
              onKeyUp={handleSelect}
              placeholder={editorPlaceholder}
              style={{ display: 'block', margin: '0 auto', width: '100%', maxWidth: 680, minHeight: 'calc(100vh - 180px)', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: settings.fontSize, lineHeight: settings.lineHeight, color: ed.text, fontFamily: theme.font.body, padding: '0 24px', letterSpacing: '0.04em', transition: 'color 0.3s' }}
            />
          </div>

          <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, background: theme.statusBar.bg, borderTop: '1px solid ' + ed.border, fontSize: 11, color: theme.statusBar.text, flexShrink: 0 }}>
            <span>{(activeChapter ? activeChapter.wordCount : 0).toLocaleString()} {t.wordUnit}</span>
            <span>{t.chapter} {Math.max(0, chapters.findIndex(c => c.id === activeChapterId)) + 1} {t.chapterOf} {chapters.length} {t.chapterUnit}</span>
          </div>
        </div>

        {aiOpen && (
          <AIPanel theme={theme} t={t} characters={characters} chapters={chapters} activeChapterId={activeChapterId} selectedText={selectedText} onInsert={handleInsert} onClose={() => setAiOpen(false)} />
        )}
      </div>

      {floatingMenu && selectedText && (
        <div style={{ position: 'fixed', top: floatingMenu.y - 44, left: floatingMenu.x, background: theme.sidebar.bg, border: '1px solid ' + theme.sidebar.border, borderRadius: 8, padding: '4px', display: 'flex', gap: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 500 }}>
          <button onClick={() => { setAiOpen(true); setFloatingMenu(null) }} style={{ padding: '5px 12px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: theme.font.body, fontWeight: 600 }}>&#10022; {t.openAI}</button>
          <button onClick={() => setFloatingMenu(null)} style={{ padding: '5px 8px', background: 'transparent', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', color: theme.sidebar.textMuted }}>&#215;</button>
        </div>
      )}

      {charModal && (
        <CharacterModal theme={theme} t={t} character={charModal === 'new' ? null : charModal} onClose={() => setCharModal(null)} onSave={saveCharacter} />
      )}
      {showProgress && <ProgressPanel theme={theme} t={t} lang={settings.lang} chapters={chapters} onClose={() => setShowProgress(false)} />}
      {showSettings && (
        <SettingsPanel
          theme={theme}
          t={t}
          lang={settings.lang}
          settings={settings}
          novel={novel}
          aiUsage={aiUsage}
          onSetting={setSetting}
          onNovelUpdate={updateNovelSettings}
          onArchiveNovel={archiveCurrentNovel}
          onPasswordUpdate={onPasswordUpdate}
          onSignOut={onSignOut}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
