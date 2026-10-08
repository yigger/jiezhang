const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const createLoader = require('./load-source.cjs')
const { emptyJournal, journalDraftKey, parseJournalDraft, validJournalDate } = createLoader()(
  'src/utils/calendar-journal.ts'
)

test('journal drafts isolate users, books and days and reject malformed data', () => {
  const key = journalDraftKey(1, 8, '2026-10-08')
  assert.notEqual(key, journalDraftKey(2, 8, '2026-10-08'))
  assert.notEqual(key, journalDraftKey(1, 9, '2026-10-08'))
  assert.notEqual(key, journalDraftKey(1, 8, '2026-10-07'))
  const entry = { ...emptyJournal('2026-10-08'), mood: 'happy', note: '散步' }
  assert.deepEqual(parseJournalDraft(entry, entry.date), entry)
  for (const value of [
    null,
    { ...entry, mood: 'unknown' },
    { ...entry, note: '字'.repeat(201) },
    { ...entry, zero_expense: 'true' }
  ]) {
    assert.equal(parseJournalDraft(value, entry.date), null)
  }
  assert.equal(parseJournalDraft(entry, '2026-10-07'), null)
})

test('calendar bookkeeping date rejects invalid and future dates', () => {
  assert.equal(validJournalDate('2026-10-08', '2026-10-08'), true)
  assert.equal(validJournalDate('2026-02-28', '2026-10-08'), true)
  for (const date of ['2026-02-30', '2026-10-09', '2026-13-01', '2026-1-1'])
    assert.equal(validJournalDate(date, '2026-10-08'), false)
})

function find(node, predicate) {
  if (Array.isArray(node)) {
    for (const child of node) {
      const result = find(child, predicate)
      if (result) return result
    }
  }
  if (!node || typeof node !== 'object') return null
  return predicate(node) ? node : find(node.props?.children, predicate)
}
function harness(save) {
  const storage = new Map()
  const slots = []
  let cursor = 0
  const hooks = {
    ...React,
    useState(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial
      return [
        slots[i],
        (value) => {
          slots[i] = typeof value === 'function' ? value(slots[i]) : value
        }
      ]
    },
    useRef(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = { current: initial }
      return slots[i]
    },
    useEffect() {}
  }
  const component = createLoader({
    react: hooks,
    '@tarojs/components': {
      View: 'view',
      Button: 'button',
      Textarea: 'textarea',
      ScrollView: 'scroll'
    },
    '@tarojs/taro': {
      getStorageSync: (key) => storage.get(key),
      setStorageSync: (key, value) => storage.set(key, value),
      removeStorageSync: (key) => storage.delete(key)
    },
    '@/components/Statements': 'statements',
    '@/jz': { api: { calendarJournal: { save } } }
  })('src/components/Statistic/CalendarJournal/Editor.tsx').default
  return {
    storage,
    render(props) {
      cursor = 0
      return component(props)
    }
  }
}
const tick = () => new Promise((resolve) => setImmediate(resolve))
const props = {
  book: 8,
  user: 2,
  date: '2026-10-08',
  statements: [],
  statementsReady: true,
  onClose() {},
  onSaved() {}
}

test('failed save keeps draft and close remains available during the request', async () => {
  let reject,
    calls = 0,
    closes = 0
  const h = harness(() => {
    calls++
    return new Promise((_, fail) => {
      reject = fail
    })
  })
  const p = {
    ...props,
    onClose: () => {
      closes++
    }
  }
  let tree = h.render(p)
  find(tree, (n) => n.type === 'textarea').props.onInput({ detail: { value: '桂花香' } })
  tree = h.render(p)
  find(tree, (n) => n.props?.className === 'journal-primary').props.onClick()
  find(tree, (n) => n.props?.className === 'journal-primary').props.onClick()
  tree = h.render(p)
  assert.equal(calls, 1)
  assert.equal(find(tree, (n) => n.props?.className === 'journal-primary').props.disabled, true)
  find(tree, (n) => n.props?.className === 'journal-close').props.onClick()
  assert.equal(closes, 1)
  reject(new Error('请求超时'))
  await tick()
  tree = h.render(p)
  assert.equal(find(tree, (n) => n.type === 'textarea').props.value, '桂花香')
  assert.equal(h.storage.get(journalDraftKey(2, 8, props.date)).note, '桂花香')
  assert.equal(find(tree, (n) => n.props?.className === 'journal-primary').props.disabled, false)
  assert.ok(find(tree, (n) => n.props?.className === 'journal-error'))
})

test('existing expense disables the stamp; diary still saves while daily ledger is unavailable', async () => {
  const calls = []
  const h = harness(async (book, entry) => {
    calls.push({ book, entry })
    return { data: entry }
  })
  let tree = h.render({ ...props, statements: [{ type: 'expend', amount: '20' }] })
  assert.equal(
    find(tree, (n) => n.props?.className?.startsWith('journal-stamp ')).props.disabled,
    true
  )
  tree = h.render({ ...props, statementsReady: false })
  find(tree, (n) => n.type === 'textarea').props.onInput({ detail: { value: '今天很开心' } })
  tree = h.render({ ...props, statementsReady: false })
  assert.equal(find(tree, (n) => n.props?.className === 'journal-primary').props.disabled, false)
  find(tree, (n) => n.props?.className === 'journal-primary').props.onClick()
  await tick()
  assert.equal(calls[0].book, 8)
  assert.equal(calls[0].entry.note, '今天很开心')
  assert.equal(h.storage.size, 0)
})

test('restored drafts survive a late save when newer local text exists', async () => {
  let finish
  const h = harness(
    () =>
      new Promise((resolve) => {
        finish = resolve
      })
  )
  const key = journalDraftKey(2, 8, props.date)
  h.storage.set(key, { ...emptyJournal(props.date), note: '旧草稿' })
  const tree = h.render(props)
  assert.equal(find(tree, (n) => n.type === 'textarea').props.value, '旧草稿')
  find(tree, (n) => n.props?.className === 'journal-primary').props.onClick()
  h.storage.set(key, { ...emptyJournal(props.date), note: '重新打开后的新内容' })
  finish({ data: { ...emptyJournal(props.date), note: '旧草稿' } })
  await tick()
  assert.equal(h.storage.get(key).note, '重新打开后的新内容')
})

test('late responses from a previous book cannot replace the visible calendar or journal', async () => {
  const slots = []
  const effects = []
  const requests = new Map()
  let cursor = 0
  const home = { currentAccountBook: { id: 8 } }
  const hooks = {
    ...React,
    useContext: () => home,
    useState(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial
      return [
        slots[i],
        (v) => {
          slots[i] = typeof v === 'function' ? v(slots[i]) : v
        }
      ]
    },
    useRef(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = { current: initial }
      return slots[i]
    },
    useMemo: (fn) => fn(),
    useEffect(fn, deps) {
      const i = cursor++
      const old = slots[i]
      if (!old || deps.some((v, j) => v !== old.deps[j])) {
        effects.push(() => {
          old?.cleanup?.()
          slots[i] = { deps, cleanup: fn() }
        })
      }
    }
  }
  const pending = (kind, book) => new Promise((resolve) => requests.set(`${kind}:${book}`, resolve))
  const component = createLoader({
    react: hooks,
    'mobx-react': { observer: (fn) => fn },
    '@tarojs/components': {
      View: 'view',
      Text: 'text',
      Button: 'button',
      Textarea: 'textarea',
      ScrollView: 'scroll'
    },
    '@tarojs/taro': { useDidShow() {} },
    '@/src/stores': { HomeStoreContext: {} },
    '@/components/Statements': 'statements',
    './CalendarJournal/index.scss': {},
    '@/jz': {
      storage: { getCurrentUser: () => ({ id: 2 }) },
      event: { on() {}, off() {} },
      toastError() {},
      api: {
        statistics: { getCalendarData: (_, book) => pending('calendar', book) },
        calendarJournal: { month: (book) => pending('journal', book) },
        statements: { list: async () => ({ data: [] }) }
      }
    }
  })('src/components/Statistic/CalendarStatistic.tsx').default
  const render = () => {
    cursor = 0
    return component({ currentDate: new Date(2026, 9, 1) })
  }
  const flush = () => {
    while (effects.length) effects.shift()()
  }
  render()
  flush()
  home.currentAccountBook = { id: 9 }
  render()
  flush()
  requests.get('calendar:9')({ data: { data: [{ date: 1, income: 0, expend: 20 }] } })
  requests.get('journal:9')({
    data: { entries: [{ ...emptyJournal('2026-10-01'), mood: 'calm' }], revoked_dates: [] }
  })
  await tick()
  requests.get('calendar:8')({ data: { data: [{ date: 1, income: 0, expend: 999 }] } })
  requests.get('journal:8')({
    data: { entries: [{ ...emptyJournal('2026-10-01'), mood: 'happy' }], revoked_dates: [] }
  })
  await tick()
  const tree = render()
  assert.equal(find(tree, (n) => n.props?.className === 'journal-day-mood').props.children, '🌤️')
  const amount = find(tree, (n) => n.props?.className === 'amount-text')
  assert.deepEqual(amount.props.children, ['−', 20])
})
