import { Theme } from '../types'

interface Props {
  text: string
  theme: Theme
}

function renderInline(str: string) {
  const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</strong>
    if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>
    return p
  })
}

export default function MarkdownView({ text, theme }: Props) {
  if (!text) return null
  const acc = theme.accent
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  const nodes = lines.map((rawLine, i) => {
    const line = rawLine.trimEnd()

    const h2 = line.match(/^#{2}\s*(.*)/)
    if (h2) return (
      <div key={i} style={{ fontSize: 13, fontWeight: 700, color: acc, marginTop: 14, marginBottom: 5, paddingBottom: 4, borderBottom: '1px solid ' + acc + '44', letterSpacing: '0.02em' }}>
        {renderInline(h2[1])}
      </div>
    )

    const h3 = line.match(/^#{3}\s*(.*)/)
    if (h3) return (
      <div key={i} style={{ fontSize: 12, fontWeight: 700, color: acc + 'cc', marginTop: 10, marginBottom: 3 }}>
        {renderInline(h3[1])}
      </div>
    )

    const h1 = line.match(/^#{1}\s+(.*)/)
    if (h1) return (
      <div key={i} style={{ fontSize: 14, fontWeight: 700, color: acc, marginTop: 14, marginBottom: 5 }}>
        {renderInline(h1[1])}
      </div>
    )

    const numMatch = line.match(/^(\d+)[.)]\s+(.*)$/)
    if (numMatch) return (
      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
        <span style={{ minWidth: 20, height: 20, background: acc + '22', color: acc, borderRadius: 4, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{numMatch[1]}</span>
        <span style={{ fontSize: 13, lineHeight: 1.7 }}>{renderInline(numMatch[2])}</span>
      </div>
    )

    const bulletMatch = line.match(/^[-*•▪]\s+(.*)/)
    if (bulletMatch) return (
      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
        <span style={{ color: acc, fontWeight: 700, fontSize: 14, lineHeight: '20px', flexShrink: 0 }}>·</span>
        <span style={{ fontSize: 13, lineHeight: 1.7 }}>{renderInline(bulletMatch[1])}</span>
      </div>
    )

    if (/^[-*_]{3,}$/.test(line.trim())) return <hr key={i} style={{ border: 'none', borderTop: '1px solid ' + acc + '33', margin: '10px 0' }} />

    if (line.trim() === '') return <div key={i} style={{ height: 6 }} />

    if (/^\*\*[^*]+\*\*[：:。]?$/.test(line.trim())) return (
      <div key={i} style={{ fontSize: 12, fontWeight: 700, color: acc + 'cc', marginTop: 8, marginBottom: 2 }}>{renderInline(line.trim())}</div>
    )

    return <div key={i} style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 2 }}>{renderInline(line)}</div>
  })

  return <div style={{ fontFamily: theme.font.body }}>{nodes}</div>
}
