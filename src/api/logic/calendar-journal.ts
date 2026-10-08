import type Request from '../request'

export interface CalendarJournalEntry {
  date: string
  mood: '' | 'happy' | 'calm' | 'tired' | 'low' | 'spark'
  note: string
  zero_expense: boolean
}
export interface CalendarJournalMonth {
  entries: CalendarJournalEntry[]
  revoked_dates: string[]
}
export default class CalendarJournal {
  constructor(private request: Request) {}
  month(book: number, month: string) {
    return this.request.get<CalendarJournalMonth>('calendar/journal', {
      account_book_id: book,
      month
    })
  }
  save(book: number, entry: CalendarJournalEntry) {
    return this.request.put<CalendarJournalEntry>(`calendar/journal?account_book_id=${book}`, entry)
  }
}
