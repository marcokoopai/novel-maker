import { Chapter, Character } from '../types'

export const CHAR_COLORS = ['#C17F3E', '#7A9B76', '#5B8FA8', '#A87B9B', '#C17F7F', '#7B9BC1']

export const STATUS_COLORS: Record<string, string> = {
  '草稿': '#C17F3E', '寫作中': '#7A9B76', '已完成': '#5B8FA8',
  'Draft': '#C17F3E', 'Writing': '#7A9B76', 'Done': '#5B8FA8',
  '写作中': '#7A9B76',
}

export const INIT_CHAPTERS: Chapter[] = [
  { id: '1', title: '初遇在咖啡廳', wordCount: 94, status: '已完成', content: '那天，陳曉晴沒想到自己會這樣狼狽地闖進一間咖啡廳。\n\n外頭的雨來得突然，她的傘不知什麼時候壞了，只好抱著筆電躲進最近的一家店——就是這家叫做「初見」的小咖啡廳。\n\n「歡迎光臨。」\n\n她來不及擦乾臉上的雨水，就對上了吧台後那雙安靜的眼睛。\n\n林沐川把視線從手中的咖啡豆移開，看了她一秒，然後遞來一條乾淨的毛巾。' },
  { id: '2', title: '雨夜的偶然', wordCount: 62, status: '寫作中', content: '第二次見到林沐川，是在一個月後的週五夜晚。\n\n曉晴去便利商店買消夜，結帳時才發現錢包忘在家裡。她正窘迫地翻著口袋，身後有人輕聲說：\n\n「我幫你付。」\n\n她愣了一下，回頭——是那個咖啡廳的男人。' },
  { id: '3', title: '相互誤解', wordCount: 0, status: '草稿', content: '' },
  { id: '4', title: '告白前夕', wordCount: 0, status: '草稿', content: '' },
]

export const INIT_CHARS: Character[] = [
  { id: 'c1', name: '陳曉晴', age: '26', role: '主角', appearance: '身高163cm，長髮，眼神溫柔中帶點迷茫。常穿碎花洋裝或寬鬆毛衣。', personality: '外表溫柔，內心其實有點軟弱，容易自我懷疑，但對朋友非常真誠。', speechStyle: '說話溫和帶點猶豫', background: '出版社編輯，剛結束一段三年戀情。', relationships: '林沐川：男主，有好感但不敢表達', color: '#C17F3E' },
  { id: 'c2', name: '林沐川', age: '29', role: '男主角', appearance: '身高180cm，短髮，眉眼深邃。常穿素色襯衫。', personality: '話少但細心，觀察力極強，外表冷淡但內心重情。', speechStyle: '話少、精準', background: '咖啡廳老闆，曾是廣告公司創意總監。', relationships: '陳曉晴：一見鍾情但慣用回避方式', color: '#5B8FA8' },
  { id: 'c3', name: '蘇小雅', age: '26', role: '女配角', appearance: '短髮，活潑，笑聲大。', personality: '開朗，愛說話，是曉晴的閨密。', speechStyle: '大聲、直接、愛起鬨', background: '曉晴的大學同學，現在是UI設計師。', relationships: '陳曉晴：閨密', color: '#7A9B76' },
]

export const INIT_NOTES = '設定：現代台北\n時間軸：春末夏初\n\n伏筆：林沐川認識曉晴前男友？'
