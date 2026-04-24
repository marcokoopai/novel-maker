// Novel Maker — Sidebar Component
const SidebarIcons = {
  chapter: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="2" y="1" width="11" height="13" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="4.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1.1"/>
      <line x1="4.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="1.1"/>
      <line x1="4.5" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  ),
  character: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2 13c0-3.038 2.462-5.5 5.5-5.5S13 9.962 13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  note: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M3 2h9a1 1 0 011 1v8l-3 3H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M12 11H9v3" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  add: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <line x1="6.5" y1="2" x2="6.5" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="2" y1="6.5" x2="11" y2="6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  chevron: (open) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s'}}>
      <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const statusColors = {
  '草稿': '#C17F3E',
  '寫作中': '#7A9B76',
  '已完成': '#5B8FA8',
};

function NovelSidebar({ theme, chapters, characters, notes, activeChapterId, onSelectChapter, onAddChapter, onNotesChange, onSelectCharacter, activeView, onViewChange }) {
  const [sideTab, setSideTab] = React.useState('chapters');
  const [expandedChapters, setExpandedChapters] = React.useState(new Set());

  const s = theme.sidebar;

  const toggleChapter = (id) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
  const doneCount = chapters.filter(c => c.status === '已完成').length;

  return (
    <div style={{
      width: 240,
      minWidth: 240,
      height: '100%',
      background: s.bg,
      borderRight: `1px solid ${s.border}`,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: theme.font.body,
      color: s.text,
      userSelect: 'none',
    }}>
      {/* Project header */}
      <div style={{padding: '18px 16px 12px', borderBottom: `1px solid ${s.border}`}}>
        <div style={{fontSize: 11, letterSpacing: '0.1em', color: s.textMuted, marginBottom: 4, textTransform: 'uppercase'}}>我的小說</div>
        <div style={{fontSize: 17, fontFamily: theme.font.heading, fontWeight: 700, color: s.text, lineHeight: 1.3}}>戀愛在晴天</div>
        <div style={{marginTop: 8, fontSize: 11, color: s.textMuted}}>
          {totalWords.toLocaleString()} 字 · {doneCount}/{chapters.length} 章節完成
        </div>
        {/* Progress bar */}
        <div style={{marginTop: 6, height: 3, background: s.border, borderRadius: 2}}>
          <div style={{
            height: '100%',
            width: `${chapters.length > 0 ? (doneCount/chapters.length)*100 : 0}%`,
            background: theme.accent,
            borderRadius: 2,
            transition: 'width 0.4s ease'
          }}/>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{display: 'flex', borderBottom: `1px solid ${s.border}`, flexShrink: 0}}>
        {[
          {id: 'chapters', icon: SidebarIcons.chapter, label: '章節'},
          {id: 'characters', icon: SidebarIcons.character, label: '角色'},
          {id: 'notes', icon: SidebarIcons.note, label: '備忘'},
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSideTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 4px',
              background: sideTab === tab.id ? s.activeBg : 'transparent',
              border: 'none',
              borderBottom: sideTab === tab.id ? `2px solid ${theme.accent}` : '2px solid transparent',
              cursor: 'pointer',
              color: sideTab === tab.id ? theme.accent : s.textMuted,
              fontSize: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              transition: 'all 0.15s',
              fontFamily: theme.font.body,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{flex: 1, overflow: 'auto', padding: '8px 0'}}>

        {sideTab === 'chapters' && (
          <div>
            {chapters.map((ch, i) => (
              <div key={ch.id}>
                <div
                  onClick={() => onSelectChapter(ch.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 16px',
                    cursor: 'pointer',
                    background: activeChapterId === ch.id ? s.activeItem : 'transparent',
                    borderLeft: activeChapterId === ch.id ? `3px solid ${theme.accent}` : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (activeChapterId !== ch.id) e.currentTarget.style.background = s.hoverBg; }}
                  onMouseLeave={e => { if (activeChapterId !== ch.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{fontSize: 10, color: s.textMuted, minWidth: 18}}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{
                    flex: 1,
                    fontSize: 13,
                    color: activeChapterId === ch.id ? s.text : s.text,
                    fontWeight: activeChapterId === ch.id ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {ch.title}
                  </span>
                  <span style={{
                    fontSize: 9,
                    color: statusColors[ch.status] || s.textMuted,
                    background: (statusColors[ch.status] || s.textMuted) + '22',
                    padding: '1px 5px',
                    borderRadius: 3,
                    whiteSpace: 'nowrap',
                  }}>
                    {ch.status}
                  </span>
                </div>
                <div style={{
                  padding: '0 16px 4px 40px',
                  fontSize: 11,
                  color: s.textMuted,
                  display: activeChapterId === ch.id ? 'block' : 'none',
                }}>
                  {(ch.wordCount || 0).toLocaleString()} 字
                </div>
              </div>
            ))}
            <button
              onClick={onAddChapter}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: s.textMuted,
                fontSize: 12,
                width: '100%',
                fontFamily: theme.font.body,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = theme.accent}
              onMouseLeave={e => e.currentTarget.style.color = s.textMuted}
            >
              {SidebarIcons.add}
              新增章節
            </button>
          </div>
        )}

        {sideTab === 'characters' && (
          <div style={{padding: '4px 0'}}>
            {characters.map(char => (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = s.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: char.color + '33',
                  border: `1.5px solid ${char.color}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: char.color,
                  fontFamily: theme.font.heading,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {char.name[0]}
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 13, fontWeight: 600, color: s.text}}>{char.name}</div>
                  <div style={{fontSize: 11, color: s.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{char.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {sideTab === 'notes' && (
          <div style={{padding: '12px'}}>
            <div style={{fontSize: 11, color: s.textMuted, marginBottom: 6}}>世界觀備忘</div>
            <textarea
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              style={{
                width: '100%',
                minHeight: 200,
                background: s.activeBg,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                padding: '8px',
                fontSize: 12,
                color: s.text,
                fontFamily: theme.font.body,
                resize: 'vertical',
                lineHeight: 1.7,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="記錄世界設定、伏筆、靈感…"
            />
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { NovelSidebar });
