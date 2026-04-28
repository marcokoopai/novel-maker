import { CSSProperties, FormEvent, useMemo, useState } from 'react'
import { Theme, Language } from '../types'
import { WORKFLOW_COPY } from '../lib/i18n'
import { supabaseConfigError } from '../lib/supabase'
import { friendlyAuthError } from '../lib/errors'

interface Props {
  theme: Theme
  lang: Language
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
  onResetPassword: (email: string) => Promise<void>
  onUpdatePassword: (password: string) => Promise<void>
  onPasswordUpdated?: () => void
}

type Mode = 'sign-in' | 'sign-up' | 'forgot-password' | 'update-password'

export default function AuthGate({ theme, lang, onSignIn, onSignUp, onResetPassword, onUpdatePassword, onPasswordUpdated }: Props) {
  const copy = WORKFLOW_COPY[lang]
  const initialMode: Mode = window.location.pathname === '/update-password' ? 'update-password' : 'sign-in'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const title = useMemo(() => {
    if (mode === 'sign-up') return copy.auth.createAccount
    if (mode === 'forgot-password') return copy.auth.resetPassword
    if (mode === 'update-password') return copy.auth.resetPassword
    return copy.auth.signIn
  }, [copy, mode])

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '9px 11px',
    background: theme.modal.inputBg,
    border: '1px solid ' + theme.modal.border,
    borderRadius: 7,
    color: theme.modal.text,
    fontFamily: theme.font.body,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const buttonStyle: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    borderRadius: 7,
    background: theme.accent,
    color: '#fff',
    fontFamily: theme.font.body,
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.75 : 1,
  }

  const run = async (fn: () => Promise<void>) => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await fn()
    } catch (err) {
      setError(err instanceof Error ? friendlyAuthError(err.message) : copy.states.error)
    } finally {
      setLoading(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (supabaseConfigError) {
      setError(copy.auth.missingConfig)
      return
    }

    if (mode === 'forgot-password') {
      void run(async () => {
        await onResetPassword(email)
        setMessage(copy.auth.resetSent)
      })
      return
    }

    if (mode === 'update-password') {
      if (password !== confirm) {
        setError(copy.auth.mismatch)
        return
      }
      void run(async () => {
        await onUpdatePassword(password)
        setMessage(copy.auth.passwordUpdated)
        onPasswordUpdated?.()
      })
      return
    }

    if (mode === 'sign-up' && password !== confirm) {
      setError(copy.auth.mismatch)
      return
    }

    void run(async () => {
      if (mode === 'sign-up') await onSignUp(email, password)
      else await onSignIn(email, password)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.app.bg, color: theme.app.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.font.body }}>
      <form onSubmit={submit} style={{ width: 360, background: theme.modal.bg, border: '1px solid ' + theme.modal.border, borderRadius: 14, boxShadow: '0 18px 50px rgba(0,0,0,0.16)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid ' + theme.modal.border, background: theme.modal.headerBg }}>
          <div style={{ fontSize: 11, color: theme.modal.textMuted, marginBottom: 4 }}>{copy.library.title}</div>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 20 }}>{title}</div>
        </div>

        <div style={{ padding: 22 }}>
          {(mode === 'sign-in' || mode === 'sign-up' || mode === 'forgot-password') && (
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', fontSize: 11, color: theme.modal.textMuted, marginBottom: 5 }}>{copy.auth.email}</span>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" required style={inputStyle} />
            </label>
          )}

          {mode !== 'forgot-password' && (
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', fontSize: 11, color: theme.modal.textMuted, marginBottom: 5 }}>{mode === 'update-password' ? copy.auth.newPassword : copy.auth.password}</span>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} required style={inputStyle} />
            </label>
          )}

          {(mode === 'sign-up' || mode === 'update-password') && (
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', fontSize: 11, color: theme.modal.textMuted, marginBottom: 5 }}>{copy.auth.confirmPassword}</span>
              <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" autoComplete="new-password" required style={inputStyle} />
            </label>
          )}

          {error && <div style={{ color: '#C0392B', background: '#fdecea', borderRadius: 7, padding: '8px 10px', fontSize: 12, marginBottom: 12 }}>{error}</div>}
          {message && <div style={{ color: theme.accent2, background: theme.accent2 + '18', borderRadius: 7, padding: '8px 10px', fontSize: 12, marginBottom: 12 }}>{message}</div>}

          <button disabled={loading} style={buttonStyle}>
            {mode === 'forgot-password'
              ? copy.auth.sendReset
              : mode === 'sign-up'
                ? copy.auth.createAccount
                : mode === 'update-password'
                  ? copy.auth.updatePassword
                  : copy.auth.signIn}
          </button>

          {mode === 'sign-in' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 12 }}>
              <button type="button" onClick={() => setMode('forgot-password')} style={{ background: 'transparent', border: 'none', color: theme.modal.textMuted, cursor: 'pointer', padding: 0 }}>{copy.auth.forgotPassword}</button>
              <button type="button" onClick={() => setMode('sign-up')} style={{ background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer', padding: 0 }}>{copy.auth.needAccount}</button>
            </div>
          )}

          {mode === 'sign-up' && (
            <button type="button" onClick={() => setMode('sign-in')} style={{ marginTop: 14, background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer', padding: 0, fontSize: 12 }}>{copy.auth.haveAccount}</button>
          )}

          {(mode === 'forgot-password' || mode === 'update-password') && (
            <button type="button" onClick={() => setMode('sign-in')} style={{ marginTop: 14, background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer', padding: 0, fontSize: 12 }}>{copy.auth.backToSignIn}</button>
          )}
        </div>
      </form>
    </div>
  )
}
