import { Theme, Translation, Chapter } from '../types'
import { STATUS_COLORS } from '../lib/data'

interface Props {
  theme: Theme
  t: Translation
  chapters: Chapter[]
  onClose: () => void
}

export default function ProgressPanel({ theme, t, chapters, onClose }: Props) {
  const s = theme.modal
  const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0)
  const target = 80000
  const pct = Math.min(100, Math.round((totalWords / target) * 100))
  const doneCount = chapters.filter(c => c.status === t.statusDone).length
  const weekData = [420, 680, 550, 890, 1200, 740, 980]
  const maxW = Math.max(...weekData)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 520, background: s.bg, borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.22)', fontFamily: theme.font.body, color: s.text }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid ' + s.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: s.headerBg }}>
          <div style={{ fontSize: 17, fontFamily: theme.font.heading, fontWeight: 700 }}>{t.progressTitle}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: s.textMuted, lineHeight: 1 }}>&#215;</button>
        </div>

        <div style={{ padding: '22px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
            {[
              [totalWords.toLocaleString(), t.wordUnit, t.totalWords],
              [doneCount + '/' + chapters.length, t.chapterUnit, t.chapComplete],
              [pct + '%', '', t.completion],
            ].map(([val, unit, label]) => (
              <div key={label} style={{ background: s.inputBg, borderRadius: 10, padding: '14px', textAlign: 'center', border: '1px solid ' + s.border }}>
                <div style={{ fontSize: 24, fontFamily: theme.font.heading, fontWeight: 700, color: theme.accent }}>{val}<span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{unit}</span></div>
                <div style={{ fontSize: 11, color: s.textMuted, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: s.textMuted, marginBottom: 5 }}>
              <span>{t.overallProgress}</span>
              <span>{t.target} {target.toLocaleString()} {t.wordUnit}</span>
            </div>
            <div style={{ height: 10, background: s.border, borderRadius: 5 }}>
              <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,' + theme.accent + 'cc,' + theme.accent + ')', borderRadius: 5 }} />
            </div>
            <div style={{ fontSize: 11, color: s.textMuted, marginTop: 4 }}>{t.wordsLeft.replace('{n}', (target - totalWords).toLocaleString())}</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: s.textMuted, marginBottom: 10 }}>{t.weeklyWords}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70 }}>
              {weekData.map((w, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', height: Math.round((w / maxW) * 60) + 'px', background: i === 6 ? theme.accent : theme.accent + '55', borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: 10, color: s.textMuted }}>{t.weekDays[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: s.textMuted, marginBottom: 8 }}>{t.chapStatus}</div>
            {chapters.map((ch, i) => (
              <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: s.inputBg, borderRadius: 6, border: '1px solid ' + s.border, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: s.textMuted, minWidth: 24 }}>Ch{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{ch.title}</span>
                <span style={{ fontSize: 11, color: s.textMuted }}>{(ch.wordCount || 0).toLocaleString()} {t.wordUnit}</span>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: (STATUS_COLORS[ch.status] || '#8B7355') + '20', color: STATUS_COLORS[ch.status] || '#8B7355' }}>{ch.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
