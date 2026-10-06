import type { StatementListItem } from '../api/types'
import { parsePositiveAmount } from './validation'

export interface StatementSuggestion {
  source: StatementListItem
  amount: string
  days: number
  key: string
}

const localDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const minutes = (time: string) => {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time)
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null
  return Number(match[1]) * 60 + Number(match[2])
}

// Circular distance also matches habits around midnight.
const distance = (a: number, b: number) => Math.min(Math.abs(a - b), 1440 - Math.abs(a - b))

export function suggestStatement(
  statements: StatementListItem[],
  now = new Date()
): StatementSuggestion | null {
  const today = localDay(now)
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - 28)
  const firstDay = localDay(cutoff)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const timeDistance = (item: StatementListItem) => {
    const value = minutes(item.time)
    return value === null ? Infinity : distance(value, currentMinutes)
  }
  const groups = new Map<string, StatementListItem[]>()
  const recorded = new Set<string>()
  for (const item of statements) {
    const time = minutes(item.time)
    if (
      !['expend', 'income'].includes(item.type) ||
      !item.category_id ||
      !item.asset_id ||
      parsePositiveAmount(String(item.amount)) === null ||
      time === null ||
      distance(time, currentMinutes) > 90 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.date)
    )
      continue
    const key = `${item.type}:${item.category_id}`
    if (item.date === today) {
      recorded.add(key)
      continue
    }
    if (item.date < firstDay || item.date >= today) continue
    groups.set(key, [...(groups.get(key) || []), item])
  }
  const candidates: Array<StatementSuggestion & { proximity: number }> = []
  for (const [key, items] of groups) {
    if (recorded.has(key)) continue
    // Each date gets one vote, so a batch of entries cannot masquerade as a daily habit.
    const daily = new Map<string, StatementListItem>()
    for (const item of items) {
      const previous = daily.get(item.date)
      if (!previous || timeDistance(item) < timeDistance(previous)) daily.set(item.date, item)
    }
    const samples = [...daily.values()]
    if (samples.length < 3) continue
    // Reuse the most recent matching entry, including its amount, account and notes.
    const source = [...items].sort(
      (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time) || b.id - a.id
    )[0]
    const proximity =
      samples.reduce((total, item) => total + timeDistance(item), 0) / samples.length
    candidates.push({
      key,
      source,
      amount: Number(source.amount).toFixed(2),
      days: samples.length,
      proximity
    })
  }
  candidates.sort(
    (a, b) =>
      b.days - a.days || a.proximity - b.proximity || b.source.date.localeCompare(a.source.date)
  )
  return candidates[0] || null
}
