import { useState } from 'react'
import { Theme, Translation, Character, Chapter } from '../types'
import { complete } from '../lib/ai'
import MarkdownView from './MarkdownView'

interface Props {
  theme: Theme
  t: Translation
  characters: Character[]
  chapters: Chapter[]
  activeChapterId: string
  selectedText: string
  onInsert: (text: string) => void
  onClose: () => void
}

function IClose() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function ISpark() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.2 3.8L12 7l-3.8 1.2L7 12l-1.2-3.8L2 7l3.8-1.2L7 1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg> }
function IInsert() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5h9M7.5 3l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ICopy() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M1 9V2a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> }
function IRegen() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5A4 4 0 0110 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M10.5 6.5A4 4 0 013 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M8.5 2l2 1.5-1.5 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.5 11l-2-1.5 1.5-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IDialogue() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H9l-3 2v-2H3a1 1 0 01-1-1V3z" stroke="currentColor" strokeWidth="1.2"/></svg> }
function IChar() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 14c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function ICheck() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }

type AIMode = 'dialogue' | 'character' | 'consistency'

export default function AIPanel({ theme, t, characters, chapters, activeChapterId, selectedText, onInsert, onClose }: Props) {
  const [mode, setMode] = useState<AIMode>('dialogue')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [contextInput, setContextInput] = useState('')
  const [speakerA, setSpeakerA] = useState(characters[0]?.name || '')
  const [speakerB, setSpeakerB] = useState(characters[1]?.name || '')
  const [copied, setCopied] = useState(false)

  const s = theme.panel
  const activeChapter = chapters.find(c => c.id === activeChapterId)

  const buildPrompt = () => {
    const profiles = characters.map(c => '[' + c.name + '] ' + c.age + ', ' + c.role + ', personality: ' + c.personality + ', speech: ' + (c.speechStyle || 'natural')).join('\n')
    if (mode === 'dialogue') return '你是言情小說寫作助手。角色：\n' + profiles + '\n\n幫' + speakerA + '和' + speakerB + '寫一段對話（約150字），情境：' + (contextInput || '兩人相遇') + (selectedText ? '\n當前場景：\n' + selectedText : '') + '\n\n對話溫柔有張力，帶點曖昧。直接輸出對話，不要說明。'
    if (mode === 'character') return '你是小說人物分析師。角色：\n' + profiles + '\n\n深度分析「' + (contextInput || speakerA) + '」，用Markdown格式輸出以下四節：\n## 核心性格\n## 潛在弱點\n## 關係動態\n## 寫作建議\n' + (selectedText ? '參考場景：' + selectedText : '') + '\n\n每節約50字，中文輸出。'
    return '你是小說編輯。角色：\n' + profiles + '\n\n用Markdown格式審查以下章節：\n## 性格一致性\n## 情節邏輯\n## 時間地點\n## 改進建議\n\n章節：\n' + (activeChapter && activeChapter.content ? activeChapter.content.slice(0, 1500) : selectedText || '（無內容）') + '\n\n中文，具體指出問題。'
  }

  const runAI = async () => {
    setLoading(true); setResult(''); setError('')
    try {
      const text = await complete(buildPrompt())
      setResult(text)
    } catch (e) {
      setError(t.aiError)
    }
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const modes = [
    { id: 'dialogue' as AIMode, label: t.aiModes.dialogue, Icon: IDialogue },
    { id: 'character' as AIMode, label: t.aiModes.character, Icon: IChar },
    { id: 'consistency' as AIMode, label: t.aiModes.consistency, Icon: ICheck },
  ]

  const fld: React.CSSProperties = { width: '100%', padding: '6px 9px', background: s.activeBg, border: '1px solid ' + s.border, borderRadius: 6, fontSize: 12, color: s.text, fontFamily: theme.font.body, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ width: 310, minWidth: 310, height: '100%', background: s.bg, borderLeft: '1px solid ' + s.border, display: 'flex', flexDirection: 'column', fontFamily: theme.font.body, color: s.text }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', borderBottom: '1px solid ' + s.border, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><ISpark /><span style={{ fontSize: 14, fontWeight: 700, fontFamily: theme.font.heading }}>{t.aiTitle}</span></div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: s.textMuted, padding: 4 }}><IClose /></button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid ' + s.border, flexShrink: 0 }}>
        {modes.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => { setMode(id); setResult(''); setError('') }}
            style={{ flex: 1, padding: '8px 4px', background: mode === id ? s.activeBg : 'transparent', border: 'none', borderBottom: mode === id ? '2px solid ' + theme.accent : '2px solid transparent', cursor: 'pointer', color: mode === id ? theme.accent : s.textMuted, fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.15s', fontFamily: theme.font.body }}>
            <Icon />{label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '13px 13px 0' }}>
        {mode === 'dialogue' && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: s.textMuted, marginBottom: 4 }}>{t.dialogueChars}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <select value={speakerA} onChange={e => setSpeakerA(e.target.value)} style={{ ...fld, flex: 1 }}>{characters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
              <span style={{ color: s.textMuted, lineHeight: '30px', fontSize: 12 }}>&#8596;</span>
              <select value={speakerB} onChange={e => setSpeakerB(e.target.value)} style={{ ...fld, flex: 1 }}>{characters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
            </div>
            <div style={{ fontSize: 11, color: s.textMuted, marginBottom: 4 }}>{t.scenDesc}</div>
            <textarea value={contextInput} onChange={e => setContextInput(e.target.value)} placeholder={t.scenPlaceholder} style={{ ...fld, minHeight: 60, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
        )}

        {mode === 'character' && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: s.textMuted, marginBottom: 4 }}>{t.analyzeChar}</div>
            <select value={contextInput || speakerA} onChange={e => setContextInput(e.target.value)} style={{ ...fld, marginBottom: 8 }}>{characters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
          </div>
        )}

        {mode === 'consistency' && (
          <div style={{ marginBottom: 12, padding: '8px 10px', background: s.activeBg, borderRadius: 6, fontSize: 12, color: s.textMuted, lineHeight: 1.6 }}>
            {t.consistencyHint.replace('{title}', activeChapter ? activeChapter.title : '—')}
          </div>
        )}

        {selectedText && (
          <div style={{ marginBottom: 12, padding: '8px 10px', background: theme.accent + '18', borderLeft: '3px solid ' + theme.accent, borderRadius: '0 4px 4px 0', fontSize: 11, lineHeight: 1.6 }}>
            <div style={{ fontSize: 10, color: theme.accent, marginBottom: 3, fontWeight: 600 }}>{t.selectedText}</div>
            {selectedText.slice(0, 120)}{selectedText.length > 120 ? '…' : ''}
          </div>
        )}

        <button onClick={runAI} disabled={loading} style={{ width: '100%', padding: '10px', background: loading ? s.border : theme.accent, color: loading ? s.textMuted : '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: theme.font.body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
          {loading
            ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>&#9675;</span>{t.generating}</>
            : <><ISpark />{t.generate}</>
          }
        </button>

        {error && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 10px', background: '#fdecea', borderRadius: 6, marginBottom: 12 }}>{error}</div>}

        {result && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: s.textMuted, marginBottom: 6 }}>{t.resultLabel}</div>
            <div style={{ background: s.activeBg, border: '1px solid ' + s.border, borderRadius: 8, padding: '12px', maxHeight: 300, overflow: 'auto', color: s.text }}>
              <MarkdownView text={result} theme={theme} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={() => onInsert(result)} style={{ flex: 1, padding: '6px 8px', background: theme.accent + 'ee', color: '#fff', border: '1px solid ' + theme.accent, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}><IInsert />{t.insertEditor}</button>
              <button onClick={handleCopy} style={{ padding: '6px 9px', background: 'transparent', color: theme.accent, border: '1px solid ' + theme.accent, borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><ICopy />{copied ? t.copied : t.copy}</button>
              <button onClick={runAI} style={{ padding: '6px 9px', background: 'transparent', color: theme.accent, border: '1px solid ' + theme.accent, borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><IRegen /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
