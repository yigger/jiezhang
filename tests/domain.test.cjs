const test = require('node:test')
const assert = require('node:assert/strict')
const createLoader = require('./load-source.cjs')
const load = createLoader()
const { parsePositiveAmount } = load('src/utils/validation.ts')
const { editTree, removeTreeItem } = load('src/utils/edit-tree.ts')
const { safeRichText } = load('src/utils/rich-text.ts')
const { EventEmitter } = load('src/utils/event.ts')

for (const value of ['0', '-1', 'Infinity', '1abc', '1.234', '', '1e3']) {
  test(`reject invalid amount ${JSON.stringify(value)}`, () =>
    assert.equal(parsePositiveAmount(value), null))
}
test('accept finite positive amounts with at most two fractional digits', () => {
  assert.equal(parsePositiveAmount(' 10.25 '), 10.25)
  assert.equal(parsePositiveAmount('0.01'), 0.01)
})

test('editing an unchanged name is allowed and preserves source state and children', () => {
  const child = Object.freeze({ name: 'child', icon_path: 'old' })
  const parent = Object.freeze({ name: 'parent', icon_path: 'p', childs: Object.freeze([child]) })
  const items = Object.freeze([parent])
  const result = editTree(
    items,
    { type: 'edit_category', parent, category: child },
    { name: 'child', icon_path: 'new' }
  )
  assert.equal(result[0].childs[0].icon_path, 'new')
  assert.equal(child.icon_path, 'old')
  const renamed = editTree(
    items,
    { type: 'edit_category', parent: null, category: parent },
    { name: 'renamed', icon_path: 'p' }
  )
  assert.equal(renamed[0].childs[0], child)
})

test('duplicate sibling names are rejected and removing a child is immutable', () => {
  const first = { name: 'a', icon_path: '' },
    second = { name: 'b', icon_path: '' }
  const parent = { name: 'p', icon_path: '', childs: [first, second] }
  assert.throws(
    () => editTree([parent], { type: 'edit_category', parent, category: first }, second),
    /同名/
  )
  assert.deepEqual(removeTreeItem([parent], parent, first)[0].childs, [second])
  assert.equal(parent.childs.length, 2)
})

test('rich text drops scripts, handlers, CSS and unsafe image URLs', () => {
  const nodes = safeRichText(
    '<p onclick="bad()">Hello <strong>world</strong><script>bad()</script></p><img src="javascript:bad()"><img src="https://img.test/a.png" onerror="bad()"><svg onload="bad()"></svg>'
  )
  assert.deepEqual(nodes[0], {
    type: 'node',
    name: 'p',
    attrs: {},
    children: [
      { type: 'text', text: 'Hello ' },
      { type: 'node', name: 'strong', attrs: {}, children: [{ type: 'text', text: 'world' }] }
    ]
  })
  assert.equal(nodes.length, 2)
  assert.deepEqual(nodes[1].attrs, { src: 'https://img.test/a.png', alt: '' })
})

test('unsubscribing one listener preserves other listeners and dispatch order', () => {
  const events = new EventEmitter(),
    calls = []
  const one = () => {
    calls.push(1)
    events.off('event', one)
  }
  const two = () => calls.push(2)
  events.on('event', one)
  events.on('event', two)
  events.emit('event')
  events.emit('event')
  assert.deepEqual(calls, [1, 2, 2])
})

test('hidden money is masked without leaking the supplied value', () => {
  const { displayAmount } = load('src/utils/validation.ts')
  assert.equal(displayAmount('12345.67', false), '****')
  assert.equal(displayAmount('12345.67', true), '12345.67')
})

test('wallet cache rejects malformed nested assets', () => {
  const { isWalletResponse } = load('src/utils/validation.ts')
  const value = {
    header: { total_asset: '0', net_worth: '0', total_liability: '0' },
    amount_visible: false,
    list: [
      { name: 'cash', amount: '0', childs: [{ id: 1, name: 'wallet', amount: '0', icon_path: '' }] }
    ],
    receivables: { name: 'receivables', amount: '0', childs: [] },
    payables: { name: 'payables', amount: '0', childs: [] }
  }
  assert.equal(isWalletResponse(value), true)
  value.list[0].childs[0] = null
  assert.equal(isWalletResponse(value), false)
})
