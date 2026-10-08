const test = require('node:test')
const assert = require('node:assert/strict')
const createLoader = require('./load-source.cjs')
const {
  analysisPeriod,
  spendingProfile,
  categoryChanges,
  analyzeSpending,
  formatMoney,
  formatChange
} = createLoader()('src/utils/spending-analysis.ts')
const now = new Date(2026, 9, 6, 15)
const period = analysisPeriod(new Date(2026, 9, 1), now)
let nextId = 1
const expense = (date, amount, categoryId = 1, extra = {}) => ({
  id: nextId++,
  date,
  time: '12:00:00',
  amount,
  type: 'expend',
  category_id: categoryId,
  category: `分类${categoryId}`,
  ...extra
})

test('an unfinished month compares matching day ranges, with a year rollover', () => {
  assert.deepEqual(period.current, { month: '2026-10', start: '2026-10-01', end: '2026-10-06' })
  assert.deepEqual(period.previous, { month: '2026-09', start: '2026-09-01', end: '2026-09-06' })
  assert.equal(period.partial, true)
  const january = analysisPeriod(new Date(2026, 0, 1), new Date(2026, 0, 15))
  assert.equal(january.previous.end, '2025-12-15')
})

test('previous-month same-day ranges are clamped to February, including leap years', () => {
  assert.equal(
    analysisPeriod(new Date(2026, 2, 1), new Date(2026, 2, 31)).previous.end,
    '2026-02-28'
  )
  assert.equal(
    analysisPeriod(new Date(2024, 2, 1), new Date(2024, 2, 30)).previous.end,
    '2024-02-29'
  )
})

test('completed months compare whole months instead of truncating to today', () => {
  const result = analysisPeriod(new Date(2026, 8, 1), now)
  assert.equal(result.partial, false)
  assert.equal(result.current.end, '2026-09-30')
  assert.equal(result.previous.end, '2026-08-31')
})

test('future months cannot produce expense analysis from supplied rows', () => {
  const future = analysisPeriod(new Date(2026, 10, 1), now)
  assert.equal(future.future, true)
  assert.equal(analyzeSpending([expense('2026-11-01', 20)], [], future).current.count, 0)
})

test('profiles use cents, distinct spending days and only in-range positive expense records', () => {
  const entries = [
    expense('2026-10-01', 0.1),
    expense('2026-10-01', 0.2),
    expense('2026-10-06', 0.3),
    expense('2026-10-07', 100),
    expense('2026-09-30', 100),
    expense('2026-10-01', 100, 1, { type: 'income' }),
    expense('2026-10-01', 100, 1, { type: 'transfer' }),
    expense('2026-10-01', 100, 1, { type: 'repayment' }),
    expense('2026-10-01', -1),
    expense('2026-10-01', 0),
    expense('2026-10-01', Infinity)
  ]
  const profile = spendingProfile(entries, period.current)
  assert.equal(profile.totalCents, 60)
  assert.equal(profile.count, 3)
  assert.equal(profile.activeDays, 2)
  assert.equal(profile.averageCents, 20)
  assert.equal(profile.categories[0].share, 100)
  assert.equal(profile.categories[0].statements.length, 3)
})

test('category share, counts and totals reconcile with the summary and do not mutate source rows', () => {
  const entries = Object.freeze([
    Object.freeze(expense('2026-10-01', 20)),
    Object.freeze(expense('2026-10-02', 30)),
    Object.freeze(expense('2026-10-03', 50, 2))
  ])
  const result = spendingProfile(entries, period.current)
  assert.equal(
    result.categories.reduce((sum, row) => sum + row.totalCents, 0),
    result.totalCents
  )
  assert.equal(
    result.categories.reduce((sum, row) => sum + row.count, 0),
    result.count
  )
  assert.equal(
    result.categories.reduce((sum, row) => sum + row.share, 0),
    100
  )
  assert.equal(result.categories[0].statements[0].date, '2026-10-02')
  assert.equal(entries[0].date, '2026-10-01')
})

test('more records at the same average amount are attributed to frequency', () => {
  const result = analyzeSpending(
    [expense('2026-10-01', 20), expense('2026-10-02', 20)],
    [expense('2026-09-01', 20)],
    period
  )
  assert.equal(result.changes[0].countEffectCents, 2000)
  assert.equal(result.changes[0].averageEffectCents, 0)
  assert.equal(result.changes[0].explanation, '主要来自笔数增加')
  assert.equal(result.changePercent, 100)
})

test('higher average amounts with unchanged counts are attributed to average ticket size', () => {
  const result = analyzeSpending([expense('2026-10-01', 40)], [expense('2026-09-01', 20)], period)
  assert.equal(result.changes[0].countEffectCents, 0)
  assert.equal(result.changes[0].averageEffectCents, 2000)
  assert.equal(result.changes[0].explanation, '主要来自平均单笔金额提高')
})

test('frequency and average effects reconcile exactly when both change', () => {
  const result = analyzeSpending(
    [expense('2026-10-01', 31.01), expense('2026-10-02', 21.02), expense('2026-10-03', 18.03)],
    [expense('2026-09-01', 15.01), expense('2026-09-02', 25.02)],
    period
  )
  const row = result.changes[0]
  assert.equal(row.countEffectCents + row.averageEffectCents, row.deltaCents)
})

test('added and disappeared categories remain visible and all category changes reconcile', () => {
  const result = analyzeSpending(
    [expense('2026-10-01', 40, 1), expense('2026-10-02', 10, 2)],
    [expense('2026-09-01', 20, 1), expense('2026-09-02', 30, 3)],
    period
  )
  assert.equal(
    result.changes.reduce((sum, row) => sum + row.deltaCents, 0),
    result.deltaCents
  )
  assert.equal(result.changes.find((row) => row.id === 2).explanation, '上期无此类支出记录')
  assert.equal(result.changes.find((row) => row.id === 3).explanation, '本期无此类支出记录')
  assert.equal(result.deltaCents, 0)
})

test('absent baselines do not generate infinite percentages or undefined averages', () => {
  const empty = analyzeSpending([], [], period)
  assert.equal(empty.changePercent, null)
  assert.equal(empty.current.averageCents, 0)
  assert.deepEqual(empty.changes, [])
  assert.equal(analyzeSpending([expense('2026-10-01', 20)], [], period).changePercent, null)
  const disappeared = analyzeSpending([], [expense('2026-09-01', 20)], period)
  assert.equal(disappeared.changePercent, -100)
})

test('same-name distinct categories stay separate, and uncategorized entries have a usable label', () => {
  const result = spendingProfile(
    [
      expense('2026-10-01', 20, 1, { category: '餐饮' }),
      expense('2026-10-02', 20, 2, { category: '餐饮' }),
      expense('2026-10-03', 20, 0, { category: '' })
    ],
    period.current
  )
  assert.equal(result.categories.length, 3)
  assert.equal(result.categories.find((row) => row.id === 0).name, '未分类')
})

test('changes sort by magnitude, and equal spending does not claim an increase', () => {
  const current = spendingProfile(
    [expense('2026-10-01', 100, 1), expense('2026-10-02', 20, 2)],
    period.current
  )
  const previous = spendingProfile(
    [expense('2026-09-01', 100, 1), expense('2026-09-02', 50, 2)],
    period.previous
  )
  const changes = categoryChanges(current, previous)
  assert.equal(changes[0].id, 2)
  assert.equal(changes[1].explanation, '支出金额持平')
})

test('formatted money and change signs are consistent with the summary', () => {
  assert.equal(formatMoney(301), '3.01')
  assert.equal(formatChange(-301), '−¥3.01')
  assert.equal(formatChange(301), '+¥3.01')
  assert.equal(formatChange(0), '¥0.00')
})

test('the monthly flow endpoint retains the account book and month, without requesting a partial page', async () => {
  const Api = createLoader()('src/api/logic/superStatement.ts').default
  const calls = []
  const api = new Api({
    get: async (...args) => {
      calls.push(args)
      return { data: { data: [] } }
    }
  })
  await api.getStatements({ year: 2026, month: 10, account_book_id: 42, order_by: 'created_at' })
  assert.equal(calls[0][0], 'super_statements/list')
  assert.deepEqual(calls[0][1], {
    year: 2026,
    month: 10,
    account_book_id: 42,
    order_by: 'created_at'
  })
})

test('aggregation and drilldown include every entry when a month has more than 1000 records', () => {
  const entries = Array.from({ length: 1001 }, () => expense('2026-10-01', 1))
  const result = analyzeSpending(entries, [], period)
  assert.equal(result.current.count, 1001)
  assert.equal(result.current.totalCents, 100100)
  assert.equal(result.current.categories[0].statements.length, 1001)
})
