// Novel Maker — Character Modal + Progress Panel

const CHAR_COLORS = ['#C17F3E', '#7A9B76', '#5B8FA8', '#A87B9B', '#C17F7F', '#7B9BC1'];

function CharacterModal({ theme, character, onClose, onSave }) {
  const [form, setForm] = React.useState(character || {
    id: Date.now().toString(),
    name: '',
    age: '',
    role: '主角',
    appearance: '',
    personality: '',
    speechStyle: '',
    background: '',
    relationships: '',
    color: CHAR_COLORS[0],
  });

  const s = theme.modal;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const roles = ['主角', '男主角', '女配角', '男配角', '反派', '其他'];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(3px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: 560,
        maxHeight: '88vh',
        background: s.bg,
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
        fontFamily: theme.font.body,
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${s.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: s.headerBg,
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: form.color + '33',
            border: `2px solid ${form.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontFamily: theme.font.heading,
            fontWeight: 700,
            color: form.color,
            flexShrink: 0,
          }}>
            {form.name ? form.name[0] : '?'}
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 11, color: s.textMuted, letterSpacing: '0.08em'}}>角色檔案</div>
            <div style={{fontSize: 18, fontFamily: theme.font.heading, fontWeight: 700, color: s.text}}>
              {form.name || '新角色'}
            </div>
          </div>
          {/* Color picker */}
          <div style={{display: 'flex', gap: 5}}>
            {CHAR_COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)} style={{
                width: 18, height: 18,
                borderRadius: '50%',
                background: c,
                border: form.color === c ? '2px solid ' + s.text : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
              }}/>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{flex: 1, overflow: 'auto', padding: '20px 24px'}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
            <Field label="姓名" required>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="角色姓名" style={inputStyle(s, theme)} />
            </Field>
            <Field label="年齡">
              <input value={form.age} onChange={e => set('age', e.target.value)}
                placeholder="例：25" style={inputStyle(s, theme)} />
            </Field>
            <Field label="角色定位">
              <select value={form.role} onChange={e => set('role', e.target.value)} style={inputStyle(s, theme)}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="說話風格">
              <input value={form.speechStyle} onChange={e => set('speechStyle', e.target.value)}
                placeholder="例：溫柔內斂、毒舌幽默…" style={inputStyle(s, theme)} />
            </Field>
          </div>

          <div style={{marginTop: 14}}>
            <Field label="外貌描述">
              <textarea value={form.appearance} onChange={e => set('appearance', e.target.value)}
                placeholder="身高、外貌特徵、穿著風格…" style={{...inputStyle(s, theme), minHeight: 60, resize: 'vertical'}} />
            </Field>
          </div>
          <div style={{marginTop: 14}}>
            <Field label="性格特質">
              <textarea value={form.personality} onChange={e => set('personality', e.target.value)}
                placeholder="個性、價值觀、行為模式…" style={{...inputStyle(s, theme), minHeight: 60, resize: 'vertical'}} />
            </Field>
          </div>
          <div style={{marginTop: 14}}>
            <Field label="背景故事">
              <textarea value={form.background} onChange={e => set('background', e.target.value)}
                placeholder="成長經歷、重要事件、動機…" style={{...inputStyle(s, theme), minHeight: 60, resize: 'vertical'}} />
            </Field>
          </div>
          <div style={{marginTop: 14}}>
            <Field label="角色關係">
              <textarea value={form.relationships} onChange={e => set('relationships', e.target.value)}
                placeholder="與其他角色的關係說明…" style={{...inputStyle(s, theme), minHeight: 50, resize: 'vertical'}} />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${s.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          background: s.headerBg,
        }}>
          <button onClick={onClose} style={{
            padding: '8px 20px',
            background: 'transparent',
            border: `1px solid ${s.border}`,
            borderRadius: 7,
            cursor: 'pointer',
            fontSize: 13,
            color: s.textMuted,
            fontFamily: theme.font.body,
          }}>取消</button>
          <button onClick={() => { onSave(form); onClose(); }} style={{
            padding: '8px 24px',
            background: theme.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: theme.font.body,
          }}>儲存角色</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <div style={{fontSize: 11, marginBottom: 5, fontWeight: 600, letterSpacing: '0.05em'}}>
        {label}{required && <span style={{color: '#C17F3E'}}> *</span>}
      </div>
      {children}
    </div>
  );
}

function inputStyle(s, theme) {
  return {
    width: '100%',
    padding: '7px 10px',
    background: s.inputBg,
    border: `1px solid ${s.border}`,
    borderRadius: 6,
    fontSize: 13,
    color: s.text,
    fontFamily: theme.font.body,
    outline: 'none',
    boxSizing: 'border-box',
    lineHeight: 1.6,
  };
}

// ── Progress Panel ──────────────────────────────────────────────────────────

function ProgressPanel({ theme, chapters, onClose }) {
  const s = theme.modal;
  const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
  const target = 80000;
  const pct = Math.min(100, Math.round((totalWords / target) * 100));
  const doneChapters = chapters.filter(c => c.status === '已完成').length;

  const weeklyData = [420, 680, 550, 890, 1200, 740, 980];
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
  const maxW = Math.max(...weeklyData);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(3px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: 520,
        background: s.bg,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
        fontFamily: theme.font.body,
        color: s.text,
      }}>
        <div style={{padding: '20px 24px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: s.headerBg}}>
          <div style={{fontSize: 17, fontFamily: theme.font.heading, fontWeight: 700}}>寫作進度</div>
          <button onClick={onClose} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: s.textMuted}}>×</button>
        </div>

        <div style={{padding: '24px'}}>
          {/* Stats row */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24}}>
            {[
              { label: '總字數', value: totalWords.toLocaleString(), unit: '字' },
              { label: '章節完成', value: `${doneChapters}/${chapters.length}`, unit: '章' },
              { label: '完成度', value: pct + '%', unit: '' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: s.inputBg,
                borderRadius: 10,
                padding: '16px',
                textAlign: 'center',
                border: `1px solid ${s.border}`,
              }}>
                <div style={{fontSize: 26, fontFamily: theme.font.heading, fontWeight: 700, color: theme.accent}}>
                  {stat.value}<span style={{fontSize: 12, fontWeight: 400, marginLeft: 2}}>{stat.unit}</span>
                </div>
                <div style={{fontSize: 11, color: s.textMuted, marginTop: 4}}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Overall progress */}
          <div style={{marginBottom: 22}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12, color: s.textMuted, marginBottom: 6}}>
              <span>整體進度</span>
              <span>目標 {target.toLocaleString()} 字</span>
            </div>
            <div style={{height: 10, background: s.border, borderRadius: 5}}>
              <div style={{
                height: '100%',
                width: pct + '%',
                background: `linear-gradient(90deg, ${theme.accent}cc, ${theme.accent})`,
                borderRadius: 5,
                transition: 'width 0.6s ease',
              }}/>
            </div>
            <div style={{fontSize: 11, color: s.textMuted, marginTop: 4}}>還差 {(target - totalWords).toLocaleString()} 字達標</div>
          </div>

          {/* Weekly bar chart */}
          <div style={{marginBottom: 22}}>
            <div style={{fontSize: 12, color: s.textMuted, marginBottom: 10}}>本週每日字數</div>
            <div style={{display: 'flex', alignItems: 'flex-end', gap: 6, height: 70}}>
              {weeklyData.map((w, i) => (
                <div key={i} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
                  <div style={{
                    width: '100%',
                    height: Math.round((w / maxW) * 60) + 'px',
                    background: i === 6 ? theme.accent : theme.accent + '55',
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 0.4s ease',
                  }}/>
                  <span style={{fontSize: 10, color: s.textMuted}}>{weekDays[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter status list */}
          <div>
            <div style={{fontSize: 12, color: s.textMuted, marginBottom: 8}}>章節狀態</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
              {chapters.map((ch, i) => (
                <div key={ch.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 10px',
                  background: s.inputBg,
                  borderRadius: 6,
                  border: `1px solid ${s.border}`,
                }}>
                  <span style={{fontSize: 11, color: s.textMuted, minWidth: 24}}>Ch{i+1}</span>
                  <span style={{flex: 1, fontSize: 13, color: s.text}}>{ch.title}</span>
                  <span style={{fontSize: 11, color: s.textMuted}}>{(ch.wordCount || 0).toLocaleString()}字</span>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: ({
                      '已完成': '#7A9B7620',
                      '寫作中': '#C17F3E20',
                      '草稿': '#8B735520',
                    })[ch.status] || '#8B735520',
                    color: ({
                      '已完成': '#7A9B76',
                      '寫作中': '#C17F3E',
                      '草稿': '#8B7355',
                    })[ch.status] || '#8B7355',
                  }}>
                    {ch.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CharacterModal, ProgressPanel, CHAR_COLORS });
