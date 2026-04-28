import { AIUsage, Chapter, Character, ChapterStatus, Novel, NovelNote, NovelSummary, NoteKind } from '../types'
import { getSupabase } from './supabase'
import { Database } from './database.types'

type NovelRow = Database['public']['Tables']['novels']['Row']
type ChapterRow = Database['public']['Tables']['chapters']['Row']
type CharacterRow = Database['public']['Tables']['characters']['Row']
type NoteRow = Database['public']['Tables']['notes']['Row']

export interface NovelWorkspace {
  novel: Novel
  chapters: Chapter[]
  characters: Character[]
  notes: NovelNote[]
}

export function toNovel(row: NovelRow): Novel {
  return {
    id: row.id,
    title: row.title,
    sourceLanguage: row.source_language,
    archivedAt: row.archived_at,
    purgeAfter: row.purge_after,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toChapter(row: ChapterRow): Chapter {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    wordCount: row.word_count,
    status: row.status as ChapterStatus,
    sortOrder: row.sort_order,
  }
}

export function toCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    role: row.role,
    appearance: row.appearance,
    personality: row.personality,
    speechStyle: row.speech_style,
    background: row.background,
    relationships: row.relationships,
    color: row.color,
    sortOrder: row.sort_order,
  }
}

export function toNote(row: NoteRow): NovelNote {
  return {
    id: row.id,
    novelId: row.novel_id,
    title: row.title,
    content: row.content,
    kind: row.kind as NoteKind,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  }
}

export function fromCharacter(novelId: string, character: Character, sortOrder = 0): Database['public']['Tables']['characters']['Insert'] {
  return {
    id: character.id,
    novel_id: novelId,
    name: character.name,
    age: character.age,
    role: character.role,
    appearance: character.appearance,
    personality: character.personality,
    speech_style: character.speechStyle,
    background: character.background,
    relationships: character.relationships,
    color: character.color,
    sort_order: character.sortOrder ?? sortOrder,
  }
}

export async function listNovelSummaries(archived = false): Promise<NovelSummary[]> {
  const supabase = getSupabase()
  const query = supabase
    .from('novels')
    .select('*')
    .order(archived ? 'archived_at' : 'updated_at', { ascending: false })

  const { data: novelRows, error } = archived
    ? await query.not('archived_at', 'is', null)
    : await query.is('archived_at', null)

  if (error) throw error
  if (!novelRows || novelRows.length === 0) return []

  const ids = novelRows.map(n => n.id)
  const { data: chapterRows, error: chaptersError } = await supabase
    .from('chapters')
    .select('novel_id, word_count')
    .in('novel_id', ids)

  if (chaptersError && !archived) throw chaptersError

  const stats = new Map<string, { chapterCount: number; totalWords: number }>()
  for (const row of chapterRows || []) {
    const current = stats.get(row.novel_id) || { chapterCount: 0, totalWords: 0 }
    current.chapterCount += 1
    current.totalWords += row.word_count || 0
    stats.set(row.novel_id, current)
  }

  return novelRows.map(row => {
    const base = toNovel(row)
    const stat = stats.get(row.id) || { chapterCount: 0, totalWords: 0 }
    return { ...base, ...stat }
  })
}

export async function createEmptyNovel(title: string, sourceLanguage: string) {
  const { data, error } = await getSupabase().rpc('create_empty_novel', {
    p_title: title,
    p_source_language: sourceLanguage,
  })
  if (error) throw error
  return data
}

export async function archiveNovel(id: string) {
  const { error } = await getSupabase().rpc('archive_novel', { p_novel_id: id })
  if (error) throw error
}

export async function restoreNovel(id: string) {
  const { error } = await getSupabase().rpc('restore_novel', { p_novel_id: id })
  if (error) throw error
}

export async function loadNovelWorkspace(novelId: string): Promise<NovelWorkspace> {
  const supabase = getSupabase()
  const [{ data: novel, error: novelError }, { data: chapters, error: chaptersError }, { data: characters, error: charactersError }, { data: notes, error: notesError }] = await Promise.all([
    supabase.from('novels').select('*').eq('id', novelId).is('archived_at', null).single(),
    supabase.from('chapters').select('*').eq('novel_id', novelId).order('sort_order').order('created_at'),
    supabase.from('characters').select('*').eq('novel_id', novelId).order('sort_order').order('created_at'),
    supabase.from('notes').select('*').eq('novel_id', novelId).order('sort_order').order('created_at'),
  ])

  if (novelError) throw novelError
  if (chaptersError) throw chaptersError
  if (charactersError) throw charactersError
  if (notesError) throw notesError
  if (!novel) throw new Error('Novel not found')

  return {
    novel: toNovel(novel),
    chapters: (chapters || []).map(toChapter),
    characters: (characters || []).map(toCharacter),
    notes: (notes || []).map(toNote),
  }
}

export async function updateNovelMeta(novelId: string, values: { title?: string; sourceLanguage?: string }) {
  const { error } = await getSupabase()
    .from('novels')
    .update({
      title: values.title,
      source_language: values.sourceLanguage,
    })
    .eq('id', novelId)

  if (error) throw error
}

export async function addChapter(novelId: string, title: string, sortOrder: number) {
  const { data, error } = await getSupabase()
    .from('chapters')
    .insert({ novel_id: novelId, title, sort_order: sortOrder, status: 'draft' })
    .select('*')
    .single()

  if (error) throw error
  return toChapter(data)
}

export async function updateChapter(chapter: Chapter) {
  const { error } = await getSupabase()
    .from('chapters')
    .update({
      title: chapter.title,
      content: chapter.content,
      summary: chapter.summary || '',
      word_count: chapter.wordCount,
      status: chapter.status,
      sort_order: chapter.sortOrder || 0,
    })
    .eq('id', chapter.id)

  if (error) throw error
}

export async function upsertCharacter(novelId: string, character: Character, sortOrder = 0) {
  const { error } = await getSupabase()
    .from('characters')
    .upsert(fromCharacter(novelId, character, sortOrder))

  if (error) throw error
}

export async function updateNote(note: NovelNote) {
  const { error } = await getSupabase()
    .from('notes')
    .update({ title: note.title, content: note.content, sort_order: note.sortOrder })
    .eq('id', note.id)

  if (error) throw error
}

export async function getAIUsage(): Promise<AIUsage | null> {
  const { data, error } = await getSupabase().rpc('get_ai_usage_for_today')
  if (error) throw error
  const usage = data?.[0]
  if (!usage) return null
  return {
    usageDate: usage.usage_date,
    novelInitCount: usage.novel_init_count,
    novelInitLimit: usage.novel_init_limit,
    writingAiCount: usage.writing_ai_count,
    writingAiLimit: usage.writing_ai_limit,
  }
}
