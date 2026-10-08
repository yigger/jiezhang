const test = require('node:test')
const assert = require('node:assert/strict')
const createLoader = require('./load-source.cjs')
const { amountCents, equalSplit } = createLoader()('src/utils/insights.ts')
test('analysis amount input preserves cents and rejects invalid or excessive values', () => {
  assert.equal(amountCents('0.10'), 10)
  assert.equal(amountCents('123.45'), 12345)
  assert.equal(amountCents('0'), 0)
  for (const value of ['-1', '1.001', 'NaN', 'Infinity', '1e3', '', '10000000000'])
    assert.equal(amountCents(value), null)
})
test('equal split allocates every cent deterministically', () => {
  const result = equalSplit(100, [1, 2, 3])
  assert.deepEqual(result, [
    { member_id: 1, amount_cents: 34 },
    { member_id: 2, amount_cents: 33 },
    { member_id: 3, amount_cents: 33 }
  ])
  assert.equal(
    result.reduce((sum, a) => sum + a.amount_cents, 0),
    100
  )
  assert.deepEqual(equalSplit(1, [1, 2]), [
    { member_id: 1, amount_cents: 1 },
    { member_id: 2, amount_cents: 0 }
  ])
  assert.deepEqual(equalSplit(10, []), [])
})

test('all analysis writes explicitly target the selected account book', async () => {
  const calls = []
  const Insights = createLoader()('src/api/logic/insights.ts').default
  const request = Object.fromEntries(
    ['get', 'post', 'put'].map((method) => [
      method,
      async (...args) => {
        calls.push([method, ...args])
        return {}
      }
    ])
  )
  const api = new Insights(request)
  await api.saveProject(42, { id: 0, name: '旅行', budget_cents: 100, archived: false })
  await api.saveFixedCost(42, {
    id: 0,
    name: '会员',
    amount_cents: 100,
    interval_months: 1,
    due_day: 1,
    category_id: 0,
    asset_id: 0,
    candidate_key: '',
    active: true
  })
  await api.saveAnnotation(42, {
    statement_id: 5,
    project_id: null,
    payer_id: null,
    fixed_cost_id: null,
    allocations: []
  })
  await api.capturePortfolio(42, '月末')
  await api.mergeMerchants(42, [1, 2], '商家')
  assert.deepEqual(
    calls.map(([method, path]) => [method, path]),
    [
      ['post', 'insights/projects?account_book_id=42'],
      ['post', 'insights/fixed_costs?account_book_id=42'],
      ['put', 'insights/annotation?account_book_id=42'],
      ['post', 'insights/portfolio?account_book_id=42'],
      ['put', 'insights/merchants?account_book_id=42']
    ]
  )
})
