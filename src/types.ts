export type ThemeVariant = 'parchment' | 'midnight' | 'minimal'
export type Language = 'zh-TW' | 'zh-CN' | 'en'

export interface Chapter {
  id: string
  title: string
  content: string
  wordCount: number
  status: string
}

export interface Character {
  id: string
  name: string
  age: string
  role: string
  appearance: string
  personality: string
  speechStyle: string
  background: string
  relationships: string
  color: string
}

export interface AppSettings {
  variant: ThemeVariant
  fontSize: number
  lineHeight: number
  showAI: boolean
  lang: Language
}

export interface ThemePart {
  bg: string
  border: string
  text: string
  textMuted: string
}

export interface Theme {
  accent: string
  accent2: string
  font: { heading: string; body: string }
  app: { bg: string; text: string }
  sidebar: ThemePart & { activeItem: string; activeBg: string; hoverBg: string }
  editor: ThemePart & { toolbarBg: string }
  panel: ThemePart & { activeBg: string }
  modal: ThemePart & { headerBg: string; inputBg: string }
  statusBar: { bg: string; text: string }
}

export interface Translation {
  appTitle: string
  myNovel: string
  chapDone: string
  tabs: { chapters: string; characters: string; notes: string }
  addChapter: string
  worldNotes: string
  worldNotesPlaceholder: string
  statusDraft: string
  statusWriting: string
  statusDone: string
  progress: string
  addChar: string
  aiOn: string
  aiOff: string
  bold: string
  italic: string
  quote: string
  saved: string
  saving: string
  chapter: string
  chapterOf: string
  chapterUnit: string
  wordUnit: string
  aiTitle: string
  aiModes: { dialogue: string; character: string; consistency: string }
  dialogueChars: string
  scenDesc: string
  scenPlaceholder: string
  analyzeChar: string
  consistencyHint: string
  selectedText: string
  generate: string
  generating: string
  aiError: string
  resultLabel: string
  insertEditor: string
  copy: string
  copied: string
  charProfile: string
  newChar: string
  cancel: string
  saveChar: string
  fields: { name: string; age: string; role: string; speechStyle: string; appearance: string; personality: string; background: string; relationships: string }
  placeholders: { name: string; age: string; speechStyle: string; appearance: string; personality: string; background: string; relationships: string }
  roles: string[]
  progressTitle: string
  totalWords: string
  chapComplete: string
  completion: string
  overallProgress: string
  target: string
  wordsLeft: string
  weeklyWords: string
  chapStatus: string
  weekDays: string[]
  openAI: string
  editorPlaceholder: string
  settings: string
  themeLabel: string
  fontSizeLabel: string
  lineHeightLabel: string
  defaultAI: string
  themeOptions: { parchment: string; midnight: string; minimal: string }
}
