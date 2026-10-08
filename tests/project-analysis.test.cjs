const test = require('node:test')
const assert = require('node:assert/strict')
const { groupProjectStatements } = require('./load-source.cjs')()('src/utils/project-analysis.ts')
const rows = [
  { id: 1, date: '2026-10-07', category_id: 1, category: '餐饮', type: 'expend', amount: 12.34 },
  { id: 2, date: '2026-10-06', category_id: 1, category: '餐饮', type: 'expend', amount: 0.1 },
  { id: 3, date: '2026-10-07', category_id: 2, category: '退款', type: 'income', amount: 2 }
]
const annotations = [
  { statement_id: 1, consumer_id: 2, payer_id: 1 },
  { statement_id: 2, payer_id: 1 },
  { statement_id: 3, consumer_id: 2 }
]
test('consumer grouping keeps unknown consumers separate from payers and reconciles cents', () => {
  const groups = groupProjectStatements(rows, annotations, [{ id: 2, name: '小李' }], 'consumer')
  assert.equal(groups[0].name, '小李')
  assert.equal(groups[0].expendCents, 1234)
  assert.equal(groups[0].incomeCents, 200)
  assert.equal(groups[1].name, '未指定消费人')
  assert.equal(groups[1].expendCents, 10)
  assert.equal(
    groups.reduce((n, g) => n + g.rows.length, 0),
    3
  )
})
test('category and day groupings include every entry once and order dates newest first', () => {
  const categories = groupProjectStatements(rows, annotations, [], 'category')
  assert.equal(categories[0].expendCents, 1244)
  const days = groupProjectStatements(rows, annotations, [], 'day')
  assert.deepEqual(
    days.map((g) => g.key),
    ['2026-10-07', '2026-10-06']
  )
  assert.equal(days[0].rows.length, 2)
})
