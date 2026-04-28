import { CSSProperties, FormEvent, useEffect, useState } from 'react'
import { Theme, Translation, AppSettings, ThemeVariant, Novel, AIUsage, Language } from '../types'
import { WORKFLOW_COPY } from '../lib/i18n'
import { friendlyAuthError } from '../lib/errors'

interface Props {
  theme: Theme
  t: Translation
  lang: Language
  settings: AppSettings
  novel?: Novel
  aiUsage?: AIUsage | null
  onSetting: (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => void
  onNovelUpdate?: (values: { title: string; sourceLanguage: string }) => Promise<void>
  onArchiveNovel?: () => Promise<void>
  onPasswordUpdate?: (password: string, currentPassword?: string) => Promise<void>
  onSignOut?: () => Promise<void>
  onClose: () => void
}

const LANG_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
]

export default function SettingsPanel({ theme, t, lang, settings, novel, aiUsage, onSetting, onNovelUpdate, onArchiveNovel, onPasswordUpdate, onSignOut, onClose }: Props) {
  const s = theme.panel
  const copy = WORKFLOW_COPY[lang]
  const [novelTitle, setNovelTitle] = useState(novel?.title || '')
  const [sourceLanguage, setSourceLanguage] = useState(novel?.sourceLanguage || 'auto')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setNovelTitle(novel?.title || '')
    setSourceLanguage(novel?.sourceLanguage || 'auto')
  }, [novel])

  const themeOpts: { value: ThemeVariant; label: string }[] = [
    { value: 'parchment', label: t.themeOptions.parchment },
    { value: 'midnight', label: t.themeOptions.midnight },
    { value: 'minimal', label: t.themeOptions.minimal },
  ]

  const inputStyle: CSSProperties = { width: '100%', padding: '7px 9px', background: s.activeBg, border: '1px solid ' + s.border, borderRadius: 6, fontSize: 12, color: s.text, fontFamily: theme.font.body, outline: 'none', boxSizing: 'border-box' }

  const run = async (fn: () => Promise<void>, success?: string) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await fn()
      if (success) setMessage(success)
    } catch (err) {
      setError(err instanceof Error ? friendlyAuthError(err.message) : copy.states.error)
    } finally {
      setBusy(false)
    }
  }

  const saveNovel = (event: FormEvent) => {
    event.preventDefault()
    if (!onNovelUpdate) return
    void run(() => onNovelUpdate({ title: novelTitle, sourceLanguage }))
  }

  const updatePassword = (event: FormEvent) => {
    event.preventDefault()
    if (!onPasswordUpdate) return
    if (newPassword !== confirmPassword) {
      setError(copy.auth.mismatch)
      return
    }
    void run(async () => {
      await onPasswordUpdate(newPassword, currentPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }, copy.settings.passwordUpdated)
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose} />
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000, width: 320, maxHeight: 'calc(100vh - 32px)', background: s.bg, border: '1px solid ' + s.border, borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.18)', fontFamily: theme.font.body, color: s.text, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid ' + s.border }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{t.settings}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: s.textMuted, fontSize: 16, lineHeight: 1, padding: '0 2px' }}>&#215;</button>
        </div>

        <div style={{ padding: '14px', overflow: 'auto' }}>
          {error && <div style={{ color: '#C0392B', background: '#fdecea', borderRadius: 6, padding: '7px 9px', fontSize: 11, marginBottom: 10 }}>{error}</div>}
          {message && <div style={{ color: theme.accent2, background: theme.accent2 + '18', borderRadius: 6, padding: '7px 9px', fontSize: 11, marginBottom: 10 }}>{message}</div>}

          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.textMuted, marginBottom: 10 }}>{copy.settings.preferences}</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.textMuted, marginBottom: 8 }}>{t.themeLabel}</div>
            <div style={{ display: 'flex', padding: 2, borderRadius: 8, background: 'rgba(0,0,0,0.06)', position: 'relative' }}>
              {themeOpts.map((opt, i) => {
                const isActive = settings.variant === opt.value
                return (
                  <button key={opt.value} onClick={() => onSetting('variant', opt.value)}
                    style={{ flex: 1, position: 'relative', zIndex: 1, border: 'none', background: 'transparent', color: isActive ? s.text : s.textMuted, fontFamily: theme.font.body, fontSize: 11, fontWeight: isActive ? 600 : 400, height: 26, borderRadius: 6, cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}>
                    {opt.label}
                    {isActive && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', borderRadius: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.12)', zIndex: -1 }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Font size */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: s.textMuted }}>{t.fontSizeLabel}</span>
              <span style={{ fontSize: 11, color: s.textMuted, opacity: 0.7 }}>{settings.fontSize}px</span>
            </div>
            <input type="range" min={13} max={24} step={1} value={settings.fontSize}
              onChange={e => onSetting('fontSize', Number(e.target.value))}
              style={{ width: '100%', height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.12)', outline: 'none', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }} />
          </div>

          {/* Line height */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: s.textMuted }}>{t.lineHeightLabel}</span>
              <span style={{ fontSize: 11, color: s.textMuted, opacity: 0.7 }}>{settings.lineHeight.toFixed(1)}</span>
            </div>
            <input type="range" min={1.5} max={2.8} step={0.1} value={settings.lineHeight}
              onChange={e => onSetting('lineHeight', Number(e.target.value))}
              style={{ width: '100%', height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.12)', outline: 'none', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }} />
          </div>

          {/* Default AI toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: s.textMuted }}>{t.defaultAI}</span>
            <button onClick={() => onSetting('showAI', !settings.showAI)}
              style={{ position: 'relative', width: 32, height: 18, border: 'none', borderRadius: 999, background: settings.showAI ? '#34c759' : 'rgba(0,0,0,0.15)', transition: 'background 0.15s', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 2, left: 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.25)', transition: 'transform 0.15s', transform: settings.showAI ? 'translateX(14px)' : 'translateX(0)' }} />
            </button>
          </div>

          {novel && (
            <form onSubmit={saveNovel} style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid ' + s.border }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.textMuted, marginBottom: 10 }}>{copy.settings.novel}</div>
              <label style={{ display: 'block', marginBottom: 10 }}>
                <span style={{ display: 'block', fontSize: 11, color: s.textMuted, marginBottom: 5 }}>{copy.settings.title}</span>
                <input value={novelTitle} onChange={e => setNovelTitle(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: 'block', marginBottom: 10 }}>
                <span style={{ display: 'block', fontSize: 11, color: s.textMuted, marginBottom: 5 }}>{copy.settings.sourceLanguage}</span>
                <select value={sourceLanguage} onChange={e => setSourceLanguage(e.target.value)} style={inputStyle}>
                  {LANG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </label>
              <button disabled={busy} style={{ width: '100%', padding: '8px 10px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 7, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: theme.font.body, fontSize: 12, fontWeight: 700 }}>{copy.settings.save}</button>
              <div style={{ marginTop: 10, fontSize: 11, color: s.textMuted }}>{copy.library.archiveHint}</div>
              <button type="button" disabled={busy} onClick={() => onArchiveNovel && void run(onArchiveNovel)} style={{ marginTop: 7, width: '100%', padding: '8px 10px', background: 'transparent', color: '#C0392B', border: '1px solid #C0392B66', borderRadius: 7, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: theme.font.body, fontSize: 12 }}>{copy.settings.archiveNovel}</button>
            </form>
          )}

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid ' + s.border }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.textMuted, marginBottom: 10 }}>{copy.settings.aiUsage}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, fontSize: 12, color: s.textMuted }}>
              <span>{copy.settings.novelInit}</span>
              <span>{aiUsage ? aiUsage.novelInitCount + '/' + aiUsage.novelInitLimit : '-'}</span>
              <span>{copy.settings.writingAi}</span>
              <span>{aiUsage ? aiUsage.writingAiCount + '/' + aiUsage.writingAiLimit : '-'}</span>
            </div>
          </div>

          {onPasswordUpdate && (
            <form onSubmit={updatePassword} style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid ' + s.border }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.textMuted, marginBottom: 10 }}>{copy.settings.account}</div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <span style={{ display: 'block', fontSize: 11, color: s.textMuted, marginBottom: 5 }}>{copy.auth.currentPassword}</span>
                <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" style={inputStyle} />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <span style={{ display: 'block', fontSize: 11, color: s.textMuted, marginBottom: 5 }}>{copy.auth.newPassword}</span>
                <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" style={inputStyle} />
              </label>
              <label style={{ display: 'block', marginBottom: 10 }}>
                <span style={{ display: 'block', fontSize: 11, color: s.textMuted, marginBottom: 5 }}>{copy.auth.confirmPassword}</span>
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" style={inputStyle} />
              </label>
              <button disabled={busy} style={{ width: '100%', padding: '8px 10px', background: 'transparent', color: theme.accent, border: '1px solid ' + theme.accent, borderRadius: 7, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: theme.font.body, fontSize: 12 }}>{copy.auth.updatePassword}</button>
              {onSignOut && (
                <button type="button" onClick={() => void onSignOut()} style={{ marginTop: 8, width: '100%', padding: '8px 10px', background: 'transparent', color: s.textMuted, border: '1px solid ' + s.border, borderRadius: 7, cursor: 'pointer', fontFamily: theme.font.body, fontSize: 12 }}>{copy.library.signOut}</button>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  )
}
