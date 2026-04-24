import { Theme, Translation, AppSettings, ThemeVariant } from '../types'

interface Props {
  theme: Theme
  t: Translation
  settings: AppSettings
  onSetting: (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => void
  onClose: () => void
}

export default function SettingsPanel({ theme, t, settings, onSetting, onClose }: Props) {
  const s = theme.panel
  const themeOpts: { value: ThemeVariant; label: string }[] = [
    { value: 'parchment', label: t.themeOptions.parchment },
    { value: 'midnight', label: t.themeOptions.midnight },
    { value: 'minimal', label: t.themeOptions.minimal },
  ]

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose} />
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000, width: 280, background: s.bg, border: '1px solid ' + s.border, borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.18)', fontFamily: theme.font.body, color: s.text, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid ' + s.border }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{t.settings}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: s.textMuted, fontSize: 16, lineHeight: 1, padding: '0 2px' }}>&#215;</button>
        </div>

        <div style={{ padding: '14px' }}>
          {/* Theme */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.textMuted, marginBottom: 8 }}>{t.themeLabel}</div>
            <div style={{ display: 'flex', padding: 2, borderRadius: 8, background: 'rgba(0,0,0,0.06)', position: 'relative' }}>
              {themeOpts.map((opt, i) => {
                const isActive = settings.variant === opt.value
                const totalWidth = 100 / themeOpts.length
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
        </div>
      </div>
    </>
  )
}
