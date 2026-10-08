import type { CalendarJournalEntry } from '../api/logic/calendar-journal'
import { isRecord } from '../api/http-result'

export const journalMoods = [
  { id: 'happy', icon: '☀️', name: '开心' },
  { id: 'calm', icon: '🌤️', name: '平静' },
  { id: 'tired', icon: '☁️', name: '疲惫' },
  { id: 'low', icon: '🌧️', name: '低落' },
  { id: 'spark', icon: '✨', name: '小确幸' }
] as const

export function emptyJournal(date: string): CalendarJournalEntry {
  return { date, mood: '', note: '', zero_expense: false }
}
export function journalDraftKey(user: number, book: number, date: string): string {
  return `calendar_journal_draft_v1_${user}_${book}_${date}`
}
export function parseJournalDraft(value: unknown, date: string): CalendarJournalEntry | null {
  if (
    !isRecord(value) ||
    value.date !== date ||
    typeof value.note !== 'string' ||
    Array.from(value.note).length > 200 ||
    typeof value.zero_expense !== 'boolean' ||
    (value.mood !== '' && !journalMoods.some((mood) => mood.id === value.mood))
  )
    return null
  return value as unknown as CalendarJournalEntry
}
export function validJournalDate(date: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day &&
    date <= today
  )
}
