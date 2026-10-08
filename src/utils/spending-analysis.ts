import type { StatementListItem } from '../api/types'
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { parsePositiveAmount } from './validation'

export interface AnalysisRange {
  month: string
  start: string
  end: string
}
export interface AnalysisPeriod {
  current: AnalysisRange
  previous: AnalysisRange
  partial: boolean
  future: boolean
}
export interface CategoryProfile {
  id: number
  name: string
  totalCents: number
  count: number
  activeDays: number
  averageCents: number
  share: number
  statements: StatementListItem[]
}
export interface SpendingProfile {
  totalCents: number
  count: number
  activeDays: number
  averageCents: number
  categories: CategoryProfile[]
}
export interface CategoryChange {
  id: number
  name: string
  current: CategoryProfile | null
  previous: CategoryProfile | null
  deltaCents: number
  countEffectCents: number
  averageEffectCents: number
  explanation: string
}

export function analysisPeriod(month: Date, now = new Date()): AnalysisPeriod {
  const currentStart = startOfMonth(month)
  const previousStart = subMonths(currentStart, 1)
  const monthKey = format(currentStart, 'yyyy-MM')
  const nowKey = format(now, 'yyyy-MM')
  const partial = monthKey === nowKey
  const currentEnd = partial ? now : endOfMonth(currentStart)
  const previousEnd = partial
    ? new Date(
        previousStart.getFullYear(),
        previousStart.getMonth(),
        Math.min(now.getDate(), endOfMonth(previousStart).getDate())
      )
    : endOfMonth(previousStart)
  const range = (start: Date, end: Date): AnalysisRange => ({
    month: format(start, 'yyyy-MM'),
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd')
  })
  return {
    current: range(currentStart, currentEnd),
    previous: range(previousStart, previousEnd),
    partial,
    future: monthKey > nowKey
  }
}

export function spendingProfile(
  statements: StatementListItem[],
  range: AnalysisRange
): SpendingProfile {
  const groups = new Map<
    number,
    { name: string; statements: StatementListItem[]; cents: number; days: Set<string> }
  >()
  const days = new Set<string>()
  let totalCents = 0
  let count = 0
  for (const item of statements) {
    const amount = parsePositiveAmount(String(item.amount))
    if (
      item.type !== 'expend' ||
      amount === null ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
      item.date < range.start ||
      item.date > range.end
    )
      continue
    const cents = Math.round(amount * 100)
    const id = item.category_id || 0
    const group = groups.get(id) || {
      name: item.category || '未分类',
      statements: [],
      cents: 0,
      days: new Set<string>()
    }
    group.statements.push(item)
    group.cents += cents
    group.days.add(item.date)
    groups.set(id, group)
    totalCents += cents
    count++
    days.add(item.date)
  }
  const categories: CategoryProfile[] = [...groups]
    .map(([id, group]) => ({
      id,
      name: group.name,
      totalCents: group.cents,
      count: group.statements.length,
      activeDays: group.days.size,
      averageCents: Math.round(group.cents / group.statements.length),
      share: totalCents ? (group.cents / totalCents) * 100 : 0,
      statements: [...group.statements].sort(
        (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time) || b.id - a.id
      )
    }))
    .sort((a, b) => b.totalCents - a.totalCents || a.id - b.id)
  return {
    totalCents,
    count,
    activeDays: days.size,
    averageCents: count ? Math.round(totalCents / count) : 0,
    categories
  }
}

export function categoryChanges(
  current: SpendingProfile,
  previous: SpendingProfile
): CategoryChange[] {
  const currentMap = new Map(current.categories.map((item) => [item.id, item]))
  const previousMap = new Map(previous.categories.map((item) => [item.id, item]))
  return [...new Set([...currentMap.keys(), ...previousMap.keys()])]
    .map((id) => {
      const currentCategory = currentMap.get(id) || null
      const previousCategory = previousMap.get(id) || null
      const deltaCents = (currentCategory?.totalCents || 0) - (previousCategory?.totalCents || 0)
      let countEffectCents = 0
      let averageEffectCents = 0
      let explanation = '支出金额持平'
      if (!previousCategory) {
        explanation = '上期无此类支出记录'
        countEffectCents = deltaCents
      } else if (!currentCategory) {
        explanation = '本期无此类支出记录'
        countEffectCents = deltaCents
      } else {
        // Symmetric decomposition: frequency and average-ticket effects add up to the exact change.
        const currentAverage = currentCategory.totalCents / currentCategory.count
        const previousAverage = previousCategory.totalCents / previousCategory.count
        countEffectCents = Math.round(
          ((currentCategory.count - previousCategory.count) * (currentAverage + previousAverage)) /
            2
        )
        averageEffectCents = deltaCents - countEffectCents
        if (deltaCents !== 0) {
          explanation =
            Math.abs(countEffectCents) >= Math.abs(averageEffectCents)
              ? `主要来自笔数${countEffectCents > 0 ? '增加' : '减少'}`
              : `主要来自平均单笔金额${averageEffectCents > 0 ? '提高' : '降低'}`
        }
      }
      return {
        id,
        name: currentCategory?.name || previousCategory?.name || '未分类',
        current: currentCategory,
        previous: previousCategory,
        deltaCents,
        countEffectCents,
        averageEffectCents,
        explanation
      }
    })
    .sort((a, b) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents) || a.id - b.id)
}

export function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2)
}
export function formatChange(cents: number): string {
  return `${cents > 0 ? '+' : cents < 0 ? '−' : ''}¥${formatMoney(Math.abs(cents))}`
}

export function analyzeSpending(
  currentRows: StatementListItem[],
  previousRows: StatementListItem[],
  period: AnalysisPeriod
) {
  const current = spendingProfile(period.future ? [] : currentRows, period.current)
  const previous = spendingProfile(period.future ? [] : previousRows, period.previous)
  const deltaCents = current.totalCents - previous.totalCents
  return {
    current,
    previous,
    changes: categoryChanges(current, previous),
    deltaCents,
    changePercent: previous.totalCents ? (deltaCents / previous.totalCents) * 100 : null
  }
}
