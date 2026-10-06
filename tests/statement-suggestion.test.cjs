const test = require('node:test')
const assert = require('node:assert/strict')
const createLoader = require('./load-source.cjs')
const { suggestStatement } = createLoader()('src/utils/statement-suggestion.ts')
const now = new Date(2026, 9, 5, 12, 0)
const entry = (date, amount = 20, extra = {}) => ({
  id: 1,
  type: 'expend',
  category_id: 2,
  category: '餐饮',
  asset_id: 3,
  asset: '微信',
  description: '午饭',
  date,
  time: '12:10:00',
  amount,
  ...extra
})
const lunch = [entry('2026-10-02', 18), entry('2026-10-03', 20), entry('2026-10-04', 90)]

test('recurring nearby entries reuse the latest amount, account and notes', () => {
  const result = suggestStatement(lunch, now)
  assert.equal(result.amount, '90.00')
  assert.equal(result.days, 3)
  assert.equal(result.source.date, '2026-10-04')
  assert.equal(result.source.description, '午饭')
  assert.equal(result.source.asset_id, 3)
})

test('the latest matching entry wins even when another entry that day is closer to now', () => {
  const latest = entry('2026-10-04', 35.5, {
    id: 2,
    time: '13:00:00',
    asset_id: 7,
    description: '晚午饭'
  })
  const result = suggestStatement([latest, ...lunch].reverse(), now)
  assert.equal(result.amount, '35.50')
  assert.equal(result.source.asset_id, 7)
  assert.equal(result.source.description, '晚午饭')
  assert.equal(result.days, 3)
})

test('one-off or duplicate entries on one date do not qualify as a daily habit', () => {
  assert.equal(suggestStatement(lunch.slice(0, 2), now), null)
  assert.equal(
    suggestStatement([entry('2026-10-04'), entry('2026-10-04'), entry('2026-10-04')], now),
    null
  )
})

test('recording the same category today suppresses a nearby suggestion even if the amount changed', () => {
  assert.equal(suggestStatement([...lunch, entry('2026-10-05', 25)], now), null)
  assert.ok(suggestStatement([...lunch, entry('2026-10-05', 25, { time: '08:00:00' })], now))
})

test('old, future, distant, unsupported and invalid entries cannot trigger a suggestion', () => {
  for (const extra of [
    { time: '09:00:00' },
    { time: '25:00' },
    { type: 'transfer' },
    { amount: -20 },
    { category_id: 0 },
    { asset_id: 0 },
    { date: '2026-09-01' },
    { date: '2026-10-06' }
  ]) {
    assert.equal(
      suggestStatement(
        lunch.map((item) => ({ ...item, ...extra })),
        now
      ),
      null
    )
  }
})

test('time matching includes the 90 minute boundary and wraps around midnight', () => {
  assert.ok(
    suggestStatement(
      lunch.map((item) => ({ ...item, time: '10:30:00' })),
      now
    )
  )
  assert.equal(
    suggestStatement(
      lunch.map((item) => ({ ...item, time: '10:29:00' })),
      now
    ),
    null
  )
  assert.ok(
    suggestStatement(
      lunch.map((item) => ({ ...item, time: '23:50:00' })),
      new Date(2026, 9, 5, 0, 10)
    )
  )
})

test('separate categories do not combine into a false recurring habit', () => {
  assert.equal(
    suggestStatement(
      lunch.map((item, i) => ({ ...item, category_id: i + 1 })),
      now
    ),
    null
  )
})

test('a more frequent nearby habit is preferred over a less frequent one', () => {
  const commute = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map((date) =>
    entry(date, 5, { category_id: 8 })
  )
  assert.equal(suggestStatement([...lunch, ...commute], now).source.category_id, 8)
})

test('quick creation explicitly targets the suggestion account book', async () => {
  const calls = []
  const load = createLoader({ '@/jz': {}, '@tarojs/taro': {} })
  const Statement = load('src/api/logic/statement.ts').default
  const api = new Statement({
    post: async (...args) => {
      calls.push(args)
      return {}
    }
  })
  await api.create({ type: 'expend', amount: 20 }, 42)
  await api.create({ type: 'income', amount: 30 })
  assert.equal(calls[0][0], 'statements?account_book_id=42')
  assert.deepEqual(calls[0][1], { statement: { type: 'expend', amount: 20 } })
  assert.equal(calls[1][0], 'statements')
})
