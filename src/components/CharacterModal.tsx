import { useState } from 'react'
import { Theme, Translation, Character } from '../types'
import { CHAR_COLORS } from '../lib/data'

interface Props {
  theme: Theme
  t: Translation
  character: Character | null
  onClose: () => void
  onSave: (char: Character) => void
}

export default function CharacterModal({ theme, t, character, onClose, onSave }: Props) {
  const initRole = t.roles[0] || '主角'
  const [form, setForm] = useState<Character>(
    character || { id: crypto.randomUUID(), name: '', age: '', role: initRole, appearance: '', personality: '', speechStyle: '', background: '', relationships: '', color: CHAR_COLORS[0] }
  )
  const s = theme.modal
  const set = (k: keyof Character, v: string) => setForm(f => ({ ...f, [k]: v }))

  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', background: s.inputBg, border: '1px solid ' + s.border, borderRadius: 6, fontSize: 13, color: s.text, fontFamily: theme.font.body, outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 560, maxHeight: '88vh', background: s.bg, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.22)', fontFamily: theme.font.body, color: s.text }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid ' + s.border, display: 'flex', alignItems: 'center', gap: 14, background: s.headerBg }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: form.color + '33', border: '2px solid ' + form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontFamily: theme.font.heading, fontWeight: 700, color: form.color, flexShrink: 0 }}>{form.name ? form.name[0] : '?'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: s.textMuted }}>{t.charProfile}</div>
            <div style={{ fontSize: 18, fontFamily: theme.font.heading, fontWeight: 700 }}>{form.name || t.newChar}</div>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {CHAR_COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: form.color === c ? '2px solid ' + s.text : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {(['name', 'input'] as const, [['name', 'input'], ['age', 'input'], ['role', 'select'], ['speechStyle', 'input']] as [keyof Character, string][]).map(([key, type]) => (
              <div key={key}>
                <div style={{ fontSize: 11, marginBottom: 5, fontWeight: 600 }}>{t.fields[key as keyof typeof t.fields]}</div>
                {type === 'select'
                  ? <select value={form[key] as string} onChange={e => set(key, e.target.value)} style={inp}>{t.roles.map(r => <option key={r} value={r}>{r}</option>)}</select>
                  : <input value={form[key] as string} onChange={e => set(key, e.target.value)} placeholder={(t.placeholders as Record<string, string>)[key]} style={inp} />
                }
              </div>
            ))}
          </div>
          {(['appearance', 'personality', 'background', 'relationships'] as const).map(key => (
            <div key={key} style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, marginBottom: 5, fontWeight: 600 }}>{t.fields[key]}</div>
              <textarea value={form[key]} onChange={e => set(key, e.target.value)} placeholder={(t.placeholders as Record<string, string>)[key]} style={{ ...inp, minHeight: 60, resize: 'vertical' }} />
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid ' + s.border, display: 'flex', justifyContent: 'flex-end', gap: 10, background: s.headerBg }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid ' + s.border, borderRadius: 7, cursor: 'pointer', fontSize: 13, color: s.textMuted, fontFamily: theme.font.body }}>{t.cancel}</button>
          <button onClick={() => { onSave(form); onClose() }} style={{ padding: '8px 24px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: theme.font.body }}>{t.saveChar}</button>
        </div>
      </div>
    </div>
  )
}
