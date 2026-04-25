import { useState, useRef, useMemo, useEffect } from 'react'
import { Character, Theme } from './types'
import { THEMES } from './lib/themes'
import { TRANSLATIONS } from './lib/i18n'
import { INIT_CHAPTERS, INIT_CHARS, INIT_NOTES, CHAR_COLORS } from './lib/data'
import { useSettings } from './hooks/useSettings'
import Sidebar from './components/Sidebar'
import AIPanel from './components/AIPanel'
import CharacterModal from './components/CharacterModal'
import ProgressPanel from './components/ProgressPanel'
import SettingsPanel from './components/SettingsPanel'

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

export default function App() {
  const [settings, setSetting] = useSettings()
  const theme = THEMES[settings.variant] || THEMES.parchment
  const t = useMemo(() => TRANSLATIONS[settings.lang] || TRANSLATIONS['en'], [settings.lang])

  const [chapters, setChapters] = useState(INIT_CHAPTERS)
  const [characters, setCharacters] = useState(INIT_CHARS)
  const [notes, setNotes] = useState(INIT_NOTES)
  const [activeChapterId, setActiveChapterId] = useState('1')
  const [aiOpen, setAiOpen] = useState(settings.showAI)
  const [selectedText, setSelectedText] = useState('')
  const [charModal, setCharModal] = useState<Character | 'new' | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [saved, setSaved] = useState(true)
  const [floatingMenu, setFloatingMenu] = useState<{ x: number; y: number } | null>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setAiOpen(settings.showAI) }, [settings.showAI])

  const activeChapter = chapters.find(c => c.id === activeChapterId)

  const updateContent = (val: string) => {
    setSaved(false)
    setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: val, wordCount: val.replace(/\s/g, '').length } : c))
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => setSaved(true), 1200)
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
    const n = { id: String(Date.now()), title: '第 ' + (chapters.length + 1) + ' 章', content: '', wordCount: 0, status: t.statusDraft }
    setChapters(prev => [...prev, n])
    setActiveChapterId(n.id)
  }

  const saveCharacter = (char: Character) => {
    setCharacters(prev => {
      const idx = prev.findIndex(c => c.id === char.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = char; return next }
      return [...prev, { ...char, color: CHAR_COLORS[prev.length % CHAR_COLORS.length] }]
    })
  }

  const wrapSel = (before: string, after: string) => {
    const ta = editorRef.current
    if (!ta) return
    const ss = ta.selectionStart, ee = ta.selectionEnd
    const cur = activeChapter ? activeChapter.content : ''
    updateContent(cur.slice(0, ss) + before + cur.slice(ss, ee) + after + cur.slice(ee))
  }

  const ed = theme.editor
  const isDark = settings.variant === 'midnight'
  const toggleTheme = () => setSetting('variant', isDark ? 'parchment' : 'midnight')
  const statusOpts = [t.statusDraft, t.statusWriting, t.statusDone]
  const editorPlaceholder = t.editorPlaceholder.replace('{title}', activeChapter ? activeChapter.title : '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: theme.app.bg, color: theme.app.text, transition: 'background 0.3s,color 0.3s' }}>
      {/* Top bar */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 16px', background: theme.sidebar.bg, borderBottom: '1px solid ' + theme.sidebar.border, gap: 8, flexShrink: 0 }}>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15, letterSpacing: '0.02em' }}>&#10022; {t.appTitle}</div>
        <div style={{ flex: 1 }} />
        <select value={activeChapter ? activeChapter.status : t.statusDraft}
          onChange={e => setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, status: e.target.value } : c))}
          style={{ padding: '3px 8px', background: 'transparent', border: '1px solid ' + theme.sidebar.border, borderRadius: 5, fontSize: 12, color: theme.app.text, fontFamily: theme.font.body, cursor: 'pointer' }}>
          {statusOpts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={settings.lang} onChange={e => setSetting('lang', e.target.value as typeof settings.lang)}
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

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar theme={theme} t={t} chapters={chapters} characters={characters} notes={notes} activeChapterId={activeChapterId} onSelectChapter={setActiveChapterId} onAddChapter={addChapter} onNotesChange={setNotes} onSelectCharacter={setCharModal} />

        {/* Editor */}
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
            <span style={{ fontSize: 11, color: ed.textMuted }}>{saved ? t.saved : t.saving}</span>
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
            <span>{t.chapter} {chapters.findIndex(c => c.id === activeChapterId) + 1} {t.chapterOf} {chapters.length} {t.chapterUnit}</span>
          </div>
        </div>

        {aiOpen && (
          <AIPanel theme={theme} t={t} characters={characters} chapters={chapters} activeChapterId={activeChapterId} selectedText={selectedText} onInsert={handleInsert} onClose={() => setAiOpen(false)} />
        )}
      </div>

      {/* Floating text selection menu */}
      {floatingMenu && selectedText && (
        <div style={{ position: 'fixed', top: floatingMenu.y - 44, left: floatingMenu.x, background: theme.sidebar.bg, border: '1px solid ' + theme.sidebar.border, borderRadius: 8, padding: '4px', display: 'flex', gap: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 500 }}>
          <button onClick={() => { setAiOpen(true); setFloatingMenu(null) }} style={{ padding: '5px 12px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: theme.font.body, fontWeight: 600 }}>&#10022; {t.openAI}</button>
          <button onClick={() => setFloatingMenu(null)} style={{ padding: '5px 8px', background: 'transparent', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', color: theme.sidebar.textMuted }}>&#215;</button>
        </div>
      )}

      {charModal && (
        <CharacterModal theme={theme} t={t} character={charModal === 'new' ? null : charModal} onClose={() => setCharModal(null)} onSave={saveCharacter} />
      )}
      {showProgress && <ProgressPanel theme={theme} t={t} chapters={chapters} onClose={() => setShowProgress(false)} />}
      {showSettings && <SettingsPanel theme={theme} t={t} settings={settings} onSetting={setSetting} onClose={() => setShowSettings(false)} />}
    </div>
  )
}
