import type { InsightAnnotationInput } from '@/api/logic/insights'
import type { StatementListItem } from '@/api/types'
export type ProjectGroupBy = 'consumer' | 'category' | 'day'
export function groupProjectStatements(
  rows: StatementListItem[],
  annotations: InsightAnnotationInput[],
  members: { id: number; name: string }[],
  by: ProjectGroupBy
) {
  const metadata = new Map(annotations.map((a) => [a.statement_id, a]))
  const groups = new Map<
    string,
    {
      key: string
      name: string
      rows: StatementListItem[]
      expendCents: number
      incomeCents: number
    }
  >()
  for (const row of rows) {
    const consumer = metadata.get(row.id)?.consumer_id
    const key =
      by === 'consumer'
        ? String(consumer || 'unknown')
        : by === 'category'
          ? String(row.category_id)
          : row.date
    const name =
      by === 'consumer'
        ? consumer
          ? members.find((m) => m.id === consumer)?.name || `成员 ${consumer}`
          : '未指定消费人'
        : by === 'category'
          ? row.category || '未分类'
          : row.date
    let g = groups.get(key)
    if (!g) {
      g = { key, name, rows: [], expendCents: 0, incomeCents: 0 }
      groups.set(key, g)
    }
    g.rows.push(row)
    if (row.type === 'expend') g.expendCents += Math.round(row.amount * 100)
    if (row.type === 'income') g.incomeCents += Math.round(row.amount * 100)
  }
  return [...groups.values()].sort((a, b) =>
    by === 'day'
      ? b.key.localeCompare(a.key)
      : b.expendCents - a.expendCents || a.key.localeCompare(b.key)
  )
}
