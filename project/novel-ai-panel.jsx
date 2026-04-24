// Novel Maker — AI Panel Component
const AIPanelIcons = {
  dialogue: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H9l-3 2v-2H3a1 1 0 01-1-1V3z" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="5" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1"/>
      <line x1="5" y1="8.5" x2="9" y2="8.5" stroke="currentColor" strokeWidth="1"/>
    </svg>
  ),
  character: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2.5 14c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  consistency: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  sparkle: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1l1.2 3.8L12 7l-3.8 1.2L7 12l-1.2-3.8L2 7l3.8-1.2L7 1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  ),
  insert: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 6.5h9M7.5 3l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  copy: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M1 9V2a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  ),
  close: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  regen: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2.5 6.5A4 4 0 0110 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M10.5 6.5A4 4 0 013 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8.5 2l2 1.5-1.5 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.5 11l-2-1.5 1.5-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

function NovelAIPanel({ theme, characters, chapters, activeChapterId, selectedText, onInsert, onClose }) {
  const [mode, setMode] = React.useState('dialogue');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState('');
  const [error, setError] = React.useState('');
  const [contextInput, setContextInput] = React.useState('');
  const [speakerA, setSpeakerA] = React.useState(characters[0]?.name || '');
  const [speakerB, setSpeakerB] = React.useState(characters[1]?.name || '');
  const [copied, setCopied] = React.useState(false);

  const activeChapter = chapters.find(c => c.id === activeChapterId);

  const s = theme.panel;

  const modes = [
    { id: 'dialogue', label: '對話補完', icon: AIPanelIcons.dialogue },
    { id: 'character', label: '角色分析', icon: AIPanelIcons.character },
    { id: 'consistency', label: '情節審查', icon: AIPanelIcons.consistency },
  ];

  const buildPrompt = () => {
    const charProfiles = characters.map(c =>
      `【${c.name}】${c.age}歲，${c.role}，性格：${c.personality}，說話風格：${c.speechStyle || '自然'}`
    ).join('\n');

    if (mode === 'dialogue') {
      return `你是一位言情小說寫作助手。以下是角色資料：\n${charProfiles}\n\n` +
        `請幫${speakerA}和${speakerB}寫一段自然真實的對話（約150字），` +
        `情境：${contextInput || '兩人相遇'}\n` +
        (selectedText ? `當前場景脈絡：\n${selectedText}\n\n` : '') +
        `對話風格：溫柔、有張力，帶點曖昧。以中文輸出，直接給出對話內容，不要加說明。`;
    }
    if (mode === 'character') {
      const charName = contextInput || speakerA;
      const char = characters.find(c => c.name === charName);
      return `你是一位小說人物分析師。以下是角色資料：\n${charProfiles}\n\n` +
        `請針對「${charName}」進行深度性格分析，包含：\n` +
        `1. 核心性格特質\n2. 潛在弱點\n3. 與其他角色的關係動態\n4. 寫作建議（如何讓這個角色更立體）\n` +
        (selectedText ? `參考場景：\n${selectedText}\n\n` : '') +
        `以中文輸出，條列清晰，約200字。`;
    }
    if (mode === 'consistency') {
      const chapterContent = activeChapter?.content || '';
      return `你是小說編輯，擅長發現情節邏輯問題。\n` +
        `小說類型：言情/現代都市\n角色：${charProfiles}\n\n` +
        `請審查以下章節內容，找出：\n` +
        `1. 性格不一致之處\n2. 情節邏輯問題\n3. 時間/地點矛盾\n4. 改進建議\n\n` +
        `章節內容：\n${chapterContent.slice(0, 1500) || selectedText || '（無內容）'}\n\n` +
        `以中文輸出，務必具體指出問題所在。`;
    }
    return '';
  };

  const runAI = async () => {
    setLoading(true);
    setResult('');
    setError('');
    try {
      const text = await window.claude.complete(buildPrompt());
      setResult(text);
    } catch (e) {
      setError('AI 服務暫時無法使用，請稍後再試。');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{
      width: 320,
      minWidth: 320,
      height: '100%',
      background: s.bg,
      borderLeft: `1px solid ${s.border}`,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: theme.font.body,
      color: s.text,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: `1px solid ${s.border}`,
        flexShrink: 0,
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          {AIPanelIcons.sparkle}
          <span style={{fontSize: 14, fontWeight: 700, fontFamily: theme.font.heading}}>AI 助理</span>
        </div>
        <button onClick={onClose} style={{background: 'transparent', border: 'none', cursor: 'pointer', color: s.textMuted, padding: 4}}>
          {AIPanelIcons.close}
        </button>
      </div>

      {/* Mode tabs */}
      <div style={{display: 'flex', borderBottom: `1px solid ${s.border}`, flexShrink: 0}}>
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setResult(''); setError(''); }}
            style={{
              flex: 1,
              padding: '9px 4px',
              background: mode === m.id ? s.activeBg : 'transparent',
              border: 'none',
              borderBottom: mode === m.id ? `2px solid ${theme.accent}` : '2px solid transparent',
              cursor: 'pointer',
              color: mode === m.id ? theme.accent : s.textMuted,
              fontSize: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              transition: 'all 0.15s',
              fontFamily: theme.font.body,
            }}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Panel body */}
      <div style={{flex: 1, overflow: 'auto', padding: '14px 14px 0'}}>

        {/* Mode-specific inputs */}
        {mode === 'dialogue' && (
          <div style={{marginBottom: 12}}>
            <label style={{fontSize: 11, color: s.textMuted, display: 'block', marginBottom: 4}}>對話角色</label>
            <div style={{display: 'flex', gap: 6, marginBottom: 8}}>
              <select value={speakerA} onChange={e => setSpeakerA(e.target.value)} style={selectStyle(s, theme)}>
                {characters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <span style={{color: s.textMuted, lineHeight: '30px', fontSize: 12}}>↔</span>
              <select value={speakerB} onChange={e => setSpeakerB(e.target.value)} style={selectStyle(s, theme)}>
                {characters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <label style={{fontSize: 11, color: s.textMuted, display: 'block', marginBottom: 4}}>情境描述</label>
            <textarea
              value={contextInput}
              onChange={e => setContextInput(e.target.value)}
              placeholder="例如：在咖啡廳偶遇，氣氛尷尬…"
              style={textareaStyle(s, theme, 64)}
            />
          </div>
        )}

        {mode === 'character' && (
          <div style={{marginBottom: 12}}>
            <label style={{fontSize: 11, color: s.textMuted, display: 'block', marginBottom: 4}}>分析角色</label>
            <select value={contextInput || speakerA} onChange={e => setContextInput(e.target.value)} style={{...selectStyle(s, theme), width: '100%', marginBottom: 8}}>
              {characters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}

        {mode === 'consistency' && (
          <div style={{marginBottom: 12}}>
            <div style={{
              fontSize: 12,
              color: s.textMuted,
              background: s.activeBg,
              padding: '8px 10px',
              borderRadius: 6,
              lineHeight: 1.6,
            }}>
              將審查目前章節「{activeChapter?.title || '（未選擇）'}」的內容，尋找性格矛盾與情節漏洞。
            </div>
          </div>
        )}

        {/* Selected text preview */}
        {selectedText && (
          <div style={{
            marginBottom: 12,
            padding: '8px 10px',
            background: theme.accent + '18',
            borderLeft: `3px solid ${theme.accent}`,
            borderRadius: '0 4px 4px 0',
            fontSize: 11,
            color: s.text,
            lineHeight: 1.6,
          }}>
            <div style={{fontSize: 10, color: theme.accent, marginBottom: 3, fontWeight: 600}}>選取文字</div>
            {selectedText.slice(0, 120)}{selectedText.length > 120 ? '…' : ''}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={runAI}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            background: loading ? s.border : theme.accent,
            color: loading ? s.textMuted : '#fff',
            border: 'none',
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: theme.font.body,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.2s',
            marginBottom: 14,
          }}
        >
          {loading ? (
            <>
              <span style={{display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 14}}>◌</span>
              生成中…
            </>
          ) : (
            <>{AIPanelIcons.sparkle} 生成</>
          )}
        </button>

        {/* Error */}
        {error && (
          <div style={{fontSize: 12, color: '#C0392B', padding: '8px 10px', background: '#fdecea', borderRadius: 6, marginBottom: 12}}>
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{marginBottom: 12}}>
            <div style={{fontSize: 11, color: s.textMuted, marginBottom: 6}}>生成結果</div>
            <div style={{
              background: s.activeBg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '12px',
              fontSize: 13,
              lineHeight: 1.85,
              color: s.text,
              whiteSpace: 'pre-wrap',
              maxHeight: 280,
              overflow: 'auto',
            }}>
              {result}
            </div>
            <div style={{display: 'flex', gap: 6, marginTop: 8}}>
              <button onClick={() => onInsert(result)} style={actionBtn(theme)}>
                {AIPanelIcons.insert} 插入編輯器
              </button>
              <button onClick={handleCopy} style={actionBtn(theme, true)}>
                {AIPanelIcons.copy} {copied ? '已複製' : '複製'}
              </button>
              <button onClick={runAI} style={actionBtn(theme, true)}>
                {AIPanelIcons.regen}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function selectStyle(s, theme) {
  return {
    flex: 1,
    padding: '5px 8px',
    background: s.activeBg,
    border: `1px solid ${s.border}`,
    borderRadius: 5,
    fontSize: 12,
    color: s.text,
    fontFamily: theme.font.body,
    outline: 'none',
    cursor: 'pointer',
  };
}

function textareaStyle(s, theme, minH) {
  return {
    width: '100%',
    minHeight: minH,
    background: s.activeBg,
    border: `1px solid ${s.border}`,
    borderRadius: 6,
    padding: '7px 9px',
    fontSize: 12,
    color: s.text,
    fontFamily: theme.font.body,
    resize: 'vertical',
    lineHeight: 1.65,
    outline: 'none',
    boxSizing: 'border-box',
  };
}

function actionBtn(theme, secondary = false) {
  return {
    flex: secondary ? undefined : 1,
    padding: '6px 10px',
    background: secondary ? 'transparent' : theme.accent + 'ee',
    color: secondary ? theme.accent : '#fff',
    border: `1px solid ${theme.accent}`,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap',
  };
}

Object.assign(window, { NovelAIPanel });
