const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const createLoader = require('./load-source.cjs')

function harness(extra = {}) {
  const slots = []
  let cursor = 0
  let effects = []
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      return [
        slots[index],
        (value) => {
          slots[index] = typeof value === 'function' ? value(slots[index]) : value
        }
      ]
    },
    useRef(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = { current: initial }
      return slots[index]
    },
    useEffect(callback, deps) {
      const index = cursor++
      if (!slots[index] || deps.some((dep, i) => dep !== slots[index][i])) effects.push(callback)
      slots[index] = deps
    }
  }
  const load = createLoader({
    react: hooks,
    '@tarojs/components': {
      View: 'view',
      Input: 'input',
      Textarea: 'textarea',
      Picker: 'picker',
      ScrollView: 'scroll',
      Switch: 'switch'
    },
    '@/src/components/UiComponents': { Button: 'button', Tabs: 'tabs' },
    '@/components/Calculator': 'calculator',
    '@/src/components/Calculator': 'calculator',
    './OptionPanel': 'option-panel',
    '@/components/SuggestedStatement/OptionPanel': 'option-panel',
    '@/components/SuggestedStatement/index.scss': {},
    './index.scss': {},
    '../SpendingAnalysis/index.scss': {},
    ...extra
  })
  return {
    load,
    render(component, props) {
      cursor = 0
      return component(props)
    },
    flush() {
      const pending = effects
      effects = []
      pending.forEach((fn) => fn())
    }
  }
}
function find(node, predicate) {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = find(child, predicate)
      if (found) return found
    }
  }
  if (!node || typeof node !== 'object') return null
  if (predicate(node)) return node
  return find(node.props?.children, predicate)
}
const tick = () => new Promise((resolve) => setImmediate(resolve))

test('calculator amount editing stays a draft until confirmation and cancel preserves the original', () => {
  const h = harness()
  const component = h.load('src/components/Statistic/InsightWorkspace/AmountField.tsx').default
  const changes = []
  const props = { label: '预算', value: '12.34', onChange: (v) => changes.push(v) }
  let tree = h.render(component, props)
  find(tree, (n) => n.props?.className === 'insight-workspace__amount').props.onClick()
  tree = h.render(component, props)
  find(tree, (n) => n.type === 'calculator').props.onChange({ value: '99.00' })
  assert.deepEqual(changes, [])
  tree = h.render(component, props)
  find(tree, (n) => n.props?.className === 'spending-analysis__link').props.onClick()
  tree = h.render(component, props)
  assert.equal(
    find(tree, (n) => n.type === 'calculator'),
    null
  )
  assert.deepEqual(changes, [])
  find(tree, (n) => n.props?.className === 'insight-workspace__amount').props.onClick()
  tree = h.render(component, props)
  const calculator = find(tree, (n) => n.type === 'calculator')
  calculator.props.onChange({ value: '20.10' })
  calculator.props.onClose()
  assert.deepEqual(changes, ['20.10'])
})

test('project save persists selected appearance, preserves integer cents and suppresses repeated submission', async () => {
  let finish
  const calls = []
  const h = harness({
    '@/components/Project/AppearancePicker': 'appearance-picker',
    '@/jz': {
      storage: { getCurrentAccountBook: () => ({ id: 8 }) },
      api: {
        insights: {
          saveProject: (...args) => {
            calls.push(args)
            return new Promise((resolve) => {
              finish = resolve
            })
          }
        }
      }
    }
  })
  const component = h.load('src/components/Statistic/InsightWorkspace/EditRule.tsx').default
  let saved = 0
  const props = {
    bookID: 8,
    draft: {
      type: 'project',
      value: { id: 0, name: '旅行', budget_cents: 12345, archived: false }
    },
    onClose: () => {},
    onSaved: () => {
      saved++
    }
  }
  let tree = h.render(component, props)
  const picker = find(tree, (n) => n.type === 'appearance-picker')
  picker.props.onIcon('jcon-car')
  picker.props.onColor('#abcdef')
  assert.equal(calls.length, 0)
  tree = h.render(component, props)
  const save = find(tree, (n) => n.type === 'button' && n.props.title === '确定保存')
  save.props.onClick()
  save.props.onClick()
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], [
    8,
    {
      id: 0,
      name: '旅行',
      icon: 'jcon-car',
      color: '#ABCDEF',
      budget_cents: 12345,
      archived: false,
      participant_ids: [],
      start_date: '',
      end_date: ''
    }
  ])
  assert.equal(saved, 0)
  finish()
  await tick()
  assert.equal(saved, 1)
})

test('annotation split is saved only after amounts reconcile to the expense', async () => {
  const calls = []
  const workspace = {
    annotations: [],
    projects: [],
    fixed_costs: [],
    editable_statement_ids: [5],
    members: [
      { id: 1, name: '成员一' },
      { id: 2, name: '成员二' }
    ]
  }
  const h = harness({
    '@/jz': {
      ensureAccountBook: async () => ({ id: 8 }),
      storage: { getCurrentAccountBook: () => ({ id: 8 }) },
      event: { emit() {} },
      api: {
        insights: {
          workspace: async () => ({ data: workspace }),
          saveAnnotation: async (...args) => calls.push(args)
        }
      }
    }
  })
  const component = h.load('src/components/Statistic/InsightWorkspace/AnnotationEditor.tsx').default
  let closed = 0
  const props = {
    statementID: 5,
    amount: 1,
    type: 'expend',
    canEdit: false,
    onClose: () => {
      closed++
    }
  }
  h.render(component, props)
  h.flush()
  await tick()
  let tree = h.render(component, props)
  find(tree, (n) => n.type === 'switch').props.onChange({ detail: { value: true } })
  tree = h.render(component, props)
  find(tree, (n) => n.type === 'button' && n.props.title === '确定保存').props.onClick()
  await tick()
  assert.equal(calls.length, 0)
  tree = h.render(component, props)
  find(tree, (n) => n.type === 'button' && n.props.title === '全部成员平均分摊').props.onClick()
  tree = h.render(component, props)
  find(tree, (n) => n.type === 'button' && n.props.title === '确定保存').props.onClick()
  await tick()
  assert.deepEqual(calls, [
    [
      8,
      {
        statement_id: 5,
        project_id: null,
        payer_id: null,
        fixed_cost_id: null,
        allocations: [
          { member_id: 1, amount_cents: 50 },
          { member_id: 2, amount_cents: 50 }
        ]
      }
    ]
  ])
  assert.equal(closed, 1)
})

test('home navigation opens projects directly and applies custom tab changes immediately', () => {
  let ids = ['index', 'project', 'asset', 'profile']
  const handlers = new Map()
  const h = harness({
    '@/components/BasePage': 'basepage',
    '@/components/Home': {
      IndexPage: 'indexpage',
      FinancePage: 'financepage',
      ProfilePage: 'profilepage',
      StatisticPage: 'statisticpage'
    },
    '@/components/Statistic/InsightWorkspace': 'workspace',
    '../../config': { host: 'https://example.test' },
    '@tarojs/taro': { useDidShow() {}, useShareAppMessage() {} },
    '@/jz': {
      storage: { getHomeTabs: () => ids },
      event: { on: (name, fn) => handlers.set(name, fn), off() {} }
    }
  })
  const Home = h.load('src/pages/home/index.tsx').default
  let tree = h.render(Home, {})
  h.flush()
  assert.deepEqual(
    tree.props.tabs.map((tab) => tab.page),
    ids
  )
  tree.props.switchTab({ page: 'project', name: '项目', icon: 'jcon-project' })
  tree = h.render(Home, {})
  assert.equal(find(tree, (n) => n.type === 'workspace').props.mode, 'projects')
  ids = ['asset', 'index', 'profile']
  handlers.get('home-tabs:updated')()
  tree = h.render(Home, {})
  assert.deepEqual(
    tree.props.tabs.map((tab) => tab.page),
    ids
  )
  assert.equal(tree.props.activeTab.page, 'index')
})

test('asset navigation hosts fixed expenses and asset history independently', () => {
  const h = harness({
    '@/components/Statistic/InsightWorkspace': 'workspace',
    '@/components/AssetBanner': 'banner',
    '@/components/Avatar': 'avatar',
    '@/src/stores': { HomeStoreContext: {} },
    'mobx-react': { observer: (component) => component },
    '@tarojs/taro': { useDidShow() {} },
    '@/jz': {}
  })
  const Finance = h.load('src/components/Home/FinancePage/index.tsx').FinancePage
  let tree = h.render(Finance, {})
  const tabs = find(tree, (n) => n.type === 'tabs')
  assert.deepEqual(
    tabs.props.tabs.map((tab) => tab.title),
    ['资产总览', '固定开销', '资产历史']
  )
  tabs.props.onChange('fixed')
  tree = h.render(Finance, {})
  assert.equal(find(tree, (n) => n.type === 'workspace').props.mode, 'fixed')
  find(tree, (n) => n.type === 'tabs').props.onChange('portfolio')
  tree = h.render(Finance, {})
  assert.equal(find(tree, (n) => n.type === 'workspace').props.mode, 'portfolio')
})

test('project quick entry uses the calculator and submits consumer and project in one write', async () => {
  const calls = []
  const selection = (id) => ({ data: [{ name: '父类', childs: [{ id, name: '选项' }] }] })
  const h = harness({
    '@/jz': {
      storage: { getCurrentAccountBook: () => ({ id: 8 }), getCurrentUser: () => ({ id: 2 }) },
      api: {
        statements: {
          categoriesWithForm: async (type) => selection(type === 'expend' ? 1 : 3),
          assetsWithForm: async () => selection(4),
          categoryFrequent: async () => ({ data: [] }),
          assetFrequent: async () => ({ data: [] }),
          create: async (...args) => {
            calls.push(args)
          }
        }
      }
    }
  })
  const component = h.load('src/components/SuggestedStatement/QuickStatementModal.tsx').default
  let saved = 0
  const props = {
    statement: {
      bookId: 8,
      dismissalKey: 'project:9',
      project: {
        id: 9,
        name: '旅行',
        members: [
          { id: 1, name: '甲' },
          { id: 2, name: '乙' }
        ]
      }
    },
    onClose() {},
    onSaved() {
      saved++
    }
  }
  let tree = h.render(component, props)
  h.flush()
  await tick()
  tree = h.render(component, props)
  find(tree, (n) =>
    n.props?.className?.includes('quick-statement__amount--editable')
  ).props.onClick()
  tree = h.render(component, props)
  const calculator = find(tree, (n) => n.type === 'calculator')
  calculator.props.onChange({ value: '12.34', operator: '', prev: '' })
  calculator.props.onClose()
  tree = h.render(component, props)
  find(tree, (n) => n.props?.className === 'quick-statement__select').props.onClick()
  tree = h.render(component, props)
  let panel = find(tree, (n) => n.type === 'option-panel')
  panel.props.onSelect(panel.props.options[0])
  tree = h.render(component, props)
  const nodes = []
  const collect = (n) => {
    if (Array.isArray(n)) return n.forEach(collect)
    if (!n || typeof n !== 'object') return
    if (n.props?.className === 'quick-statement__select') nodes.push(n)
    collect(n.props?.children)
  }
  collect(tree)
  nodes[1].props.onClick()
  tree = h.render(component, props)
  panel = find(tree, (n) => n.type === 'option-panel')
  panel.props.onSelect(panel.props.options[0])
  tree = h.render(component, props)
  await find(tree, (n) => n.type === 'button' && n.props.title === '确定').props.onClick()
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0].project_id, 9)
  assert.equal(calls[0][0].consumer_id, 2)
  assert.equal(calls[0][0].amount, 12.34)
  assert.equal(calls[0][1], 8)
  assert.equal(saved, 1)
})

test('quick selection searches parent names, puts frequent choices first and retains type isolation', () => {
  const h = harness()
  const component = h.load('src/components/SuggestedStatement/OptionPanel.tsx').default
  const selected = []
  const props = {
    kind: 'category',
    selectedID: 1,
    type: 'expend',
    options: [
      { id: 1, name: '早餐', group: '餐饮', type: 'expend', frequentRank: 1 },
      { id: 2, name: '晚餐', group: '餐饮', type: 'expend', frequentRank: 0 },
      { id: 3, name: '工资', group: '工作', type: 'income', frequentRank: 0 }
    ],
    onSelect: (o) => selected.push(o.id),
    onBack() {}
  }
  let tree = h.render(component, props)
  const choices = (tree) => {
    const result = []
    const visit = (n) => {
      if (Array.isArray(n)) return n.forEach(visit)
      if (!n || typeof n !== 'object') return
      if (n.props?.className?.includes('quick-options__choice')) result.push(n)
      visit(n.props?.children)
    }
    visit(tree)
    return result
  }
  assert.equal(choices(tree)[0].props.children[0], '晚餐')
  find(tree, (n) => n.type === 'input').props.onInput({ detail: { value: ' 餐饮 ' } })
  tree = h.render(component, props)
  assert.equal(choices(tree).length, 4)
  find(tree, (n) => n.type === 'input').props.onInput({ detail: { value: '工资' } })
  tree = h.render(component, props)
  assert.equal(choices(tree).length, 0)
  find(tree, (n) => n.props?.onClick && n.props?.children === '收入').props.onClick()
  tree = h.render(component, props)
  assert.equal(choices(tree)[0].props.children[0], '工资')
  choices(tree)[0].props.onClick()
  assert.deepEqual(selected, [3])
})

test('fixed-cost confirmation requires a category and wallet and sends both chosen IDs', async () => {
  const calls = []
  const selection = (id) => ({
    frequent: [],
    data: [{ name: '父类', childs: [{ id, name: '选项' }] }]
  })
  const h = harness({
    '@/jz': {
      storage: { getCurrentAccountBook: () => ({ id: 8 }) },
      api: {
        statements: {
          categoriesWithForm: async () => selection(4),
          assetsWithForm: async () => selection(6)
        },
        insights: { saveFixedCost: async (...args) => calls.push(args) }
      }
    }
  })
  const component = h.load('src/components/Statistic/InsightWorkspace/EditRule.tsx').default
  const props = {
    bookID: 8,
    draft: {
      type: 'fixed',
      value: {
        id: 0,
        name: '会员',
        amount_cents: 125,
        category_id: 0,
        asset_id: 0,
        interval_months: 1,
        due_day: 31,
        active: true,
        candidate_key: ''
      }
    },
    onClose() {},
    onSaved() {}
  }
  let tree = h.render(component, props)
  h.flush()
  await tick()
  tree = h.render(component, props)
  await find(tree, (n) => n.type === 'button' && n.props.title === '确定保存').props.onClick()
  assert.equal(calls.length, 0)
  find(
    tree,
    (n) =>
      n.props?.onClick && Array.isArray(n.props.children) && n.props.children[0] === '支出分类：'
  ).props.onClick()
  tree = h.render(component, props)
  find(tree, (n) => n.type === 'option-panel').props.onSelect({ id: 4 })
  tree = h.render(component, props)
  find(
    tree,
    (n) => n.props?.onClick && Array.isArray(n.props.children) && n.props.children[0] === '钱包：'
  ).props.onClick()
  tree = h.render(component, props)
  find(tree, (n) => n.type === 'option-panel').props.onSelect({ id: 6 })
  tree = h.render(component, props)
  await find(tree, (n) => n.type === 'button' && n.props.title === '确定保存').props.onClick()
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], 8)
  assert.equal(calls[0][1].category_id, 4)
  assert.equal(calls[0][1].asset_id, 6)
  assert.equal(calls[0][1].amount_cents, 125)
})

test('asset snapshot dialog keeps note as a draft until confirm and disables actions while saving', () => {
  const h = harness()
  const component = h.load('src/components/Statistic/InsightWorkspace/SnapshotDialog.tsx').default
  const saved = []
  let closed = 0
  const props = {
    saving: false,
    error: '',
    onClose() {
      closed++
    },
    onConfirm: (note) => saved.push(note)
  }
  let tree = h.render(component, props)
  find(tree, (n) => n.type === 'textarea').props.onInput({ detail: { value: ' 月末盘点 ' } })
  assert.deepEqual(saved, [])
  tree = h.render(component, props)
  find(tree, (n) => n.type === 'button' && n.props.title === '取消').props.onClick()
  assert.equal(closed, 1)
  assert.deepEqual(saved, [])
  find(tree, (n) => n.type === 'button' && n.props.title === '确定保存').props.onClick()
  assert.deepEqual(saved, ['月末盘点'])
  tree = h.render(component, { ...props, saving: true })
  assert.equal(find(tree, (n) => n.type === 'textarea').props.disabled, true)
  assert.equal(
    find(tree, (n) => n.type === 'button' && n.props.title === '取消').props.disabled,
    true
  )
})

test('statement project selection filters archived projects, searches and defaults to an eligible consumer', () => {
  const h = harness()
  const component = h.load('src/components/Project/StatementProjectField.tsx').default
  const calls = []
  const props = {
    workspace: {
      projects: [
        { id: 1, name: '旅行', participant_ids: [2], archived: false },
        { id: 2, name: '装修', participant_ids: [], archived: false },
        { id: 3, name: '已归档', archived: true }
      ],
      members: [
        { id: 1, name: '甲' },
        { id: 2, name: '乙' }
      ]
    },
    currentUserID: 1,
    onChange: (...args) => calls.push(args)
  }
  let tree = h.render(component, props)
  find(tree, (n) => n.props?.className === 'statement-project__row').props.onClick()
  tree = h.render(component, props)
  find(tree, (n) => n.type === 'input').props.onInput({ detail: { value: '旅行' } })
  tree = h.render(component, props)
  assert.equal(
    find(tree, (n) => n.key === '2'),
    null
  )
  assert.equal(
    find(tree, (n) => n.key === '3'),
    null
  )
  find(tree, (n) => n.key === '1').props.onClick()
  assert.deepEqual(calls, [[1, 2]])
  tree = h.render(component, { ...props, projectID: 1, consumerID: 2 })
  find(tree, (n) => n.props?.className === 'statement-project__row').props.onClick()
  tree = h.render(component, { ...props, projectID: 1, consumerID: 2 })
  find(tree, (n) => n.props?.className === 'statement-project__choice').props.onClick()
  assert.deepEqual(calls.at(-1), [0, 0])
  assert.equal(h.render(component, { ...props, workspace: { projects: [], members: [] } }), null)
})

test('standard entry sends project and consumer with the statement in one scoped write', async () => {
  const calls = []
  let bookID = 8
  const h = harness({
    '@tarojs/taro': {
      useDidShow: () => {},
      showLoading: async () => {},
      hideLoading: async () => {}
    },
    'taro-ui': { AtImagePicker: 'images', AtTextarea: 'textarea' },
    './CategorySelect': 'categories',
    './PayeeSelect': 'payees',
    '@/components/Project/StatementProjectField': 'project-field',
    '@/jz': {
      storage: { getCurrentAccountBook: () => ({ id: bookID }), getCurrentUser: () => ({ id: 2 }) },
      toastError: () => {},
      event: { emit: () => {} },
      router: { navigateBack: () => {} },
      api: {
        insights: {
          workspace: async () => ({
            data: {
              projects: [{ id: 9, archived: false, participant_ids: [2] }],
              members: [{ id: 2, name: '乙' }]
            }
          })
        },
        statements: {
          assetFrequent: async () => ({ data: [] }),
          categoryFrequent: async () => ({ data: [] }),
          defaultCategoryAsset: async () => ({ data: {} }),
          create: async (...args) => {
            calls.push(args)
            return { data: { status: 200, data: { id: 99 } } }
          }
        }
      }
    }
  })
  const component = h.load('src/components/statementForm/baseForm.tsx').default
  const props = {
    typeName: '支出',
    statementType: 'expend',
    form: {
      amount: '12.34',
      type: 'expend',
      category_id: 1,
      asset_id: 4,
      upload_files: [],
      project_id: 9,
      consumer_id: 2
    },
    setForm: () => {}
  }
  h.render(component, props)
  h.flush()
  await tick()
  let tree = h.render(component, props)
  const button = find(tree, (n) => n.type === 'button' && n.props.title === '保存')
  assert.ok(button)
  await button.props.onClick()
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0].project_id, 9)
  assert.equal(calls[0][0].consumer_id, 2)
  assert.equal(calls[0][1], 8)
  bookID = 10
  tree = h.render(component, props)
  await find(tree, (n) => n.type === 'button' && n.props.title === '保存').props.onClick()
  assert.equal(calls.length, 1)
})

test('home header hides every concrete amount while retaining trend and budget percentages', () => {
  const h = harness({
    'mobx-react': { observer: (x) => x },
    '@/src/stores': { HomeStoreContext: {} },
    '@/components/SuggestedStatement': 'suggestions',
    '@/components/SuggestedStatement/QuickStatementModal': 'quick-modal',
    '@/components/EmptyTips': 'empty',
    '@/components/Statements': 'statements',
    '@/jz': {},
    '@tarojs/taro': {},
    'taro-ui': { AtProgress: 'progress' }
  })
  const { Header } = h.load('src/components/Home/IndexPage/index.tsx')
  const header = {
    today_expend: '123.45',
    month_expend: '2345.67',
    month_budget: '9876.54',
    use_pencentage: 24,
    trends: {
      day: { amount: '11.11', ratio: 3, trend: 'up' },
      week: { amount: '22.22', ratio: 4, trend: 'down' },
      month: { amount: '33.33', ratio: 5, trend: 'up' }
    }
  }
  let toggled = 0
  const hidden = Header({ header, amountVisible: false, onToggle: () => toggled++ })
  const text = JSON.stringify(hidden)
  for (const value of ['123.45', '2345.67', '9876.54', '11.11', '22.22', '33.33'])
    assert.equal(text.includes(value), false)
  assert.equal(find(hidden, (n) => n.type === 'progress').props.percent, 24)
  find(hidden, (n) => n.props?.className === 'home-amount-toggle').props.onClick()
  assert.equal(toggled, 1)
  assert.ok(JSON.stringify(Header({ header })).includes('123.45'))
})

test('quick expense uses only amount, category and asset and never loads income categories', async () => {
  const calls = []
  const categoryTypes = []
  const h = harness({
    '@/jz': {
      storage: { getCurrentAccountBook: () => ({ id: 8 }) },
      api: {
        statements: {
          categoriesWithForm: async (type) => {
            categoryTypes.push(type)
            return { data: [{ name: '生活', childs: [{ id: 1, name: '餐饮' }] }], frequent: [] }
          },
          assetsWithForm: async () => ({
            data: [{ name: '现金', childs: [{ id: 4, name: '钱包' }] }],
            frequent: []
          }),
          categoryFrequent: async () => ({ data: [] }),
          assetFrequent: async () => ({ data: [] }),
          create: async (...args) => calls.push(args)
        }
      }
    }
  })
  const component = h.load('src/components/SuggestedStatement/QuickStatementModal.tsx').default
  const props = {
    statement: { bookId: 8, expenseOnly: true, dismissalKey: 'quick' },
    onClose: () => {},
    onSaved: () => {}
  }
  let tree = h.render(component, props)
  h.flush()
  await tick()
  tree = h.render(component, props)
  const calculator = find(tree, (n) => n.type === 'calculator')
  assert.ok(calculator)
  calculator.props.onChange({ value: '12.34', operator: '', prev: '' })
  calculator.props.onClose()
  tree = h.render(component, props)
  assert.equal(
    find(tree, (n) => n.type === 'textarea'),
    null
  )
  find(tree, (n) => n.props?.className === 'quick-statement__select').props.onClick()
  tree = h.render(component, props)
  const categories = find(tree, (n) => n.type === 'option-panel')
  assert.equal(categories.props.allowIncome, false)
  categories.props.onSelect({ id: 1, type: 'expend' })
  tree = h.render(component, props)
  // Find the asset selector by its parent row label.
  const assetRow = find(
    tree,
    (n) =>
      n.props?.className === 'quick-statement__row' && n.props.children[0].props.children === '资产'
  )
  assetRow.props.children[1].props.onClick()
  tree = h.render(component, props)
  find(tree, (n) => n.type === 'option-panel').props.onSelect({ id: 4 })
  tree = h.render(component, props)
  await find(tree, (n) => n.type === 'button' && n.props.title === '确定').props.onClick()
  assert.deepEqual(categoryTypes, ['expend'])
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0].type, 'expend')
  assert.equal(calls[0][0].amount, 12.34)
  assert.equal(calls[0][0].category_id, 1)
  assert.equal(calls[0][0].asset_id, 4)
  assert.equal(calls[0][1], 8)
})

test('quick expense protects unsaved input from mask dismissal and confirms explicit discard', () => {
  const h = harness({ '@/jz': { storage: { getCurrentUser: () => null } } })
  const component = h.load('src/components/SuggestedStatement/QuickStatementModal.tsx').default
  let closed = 0
  const props = {
    statement: { bookId: 8, expenseOnly: true },
    onClose: () => closed++,
    onSaved: () => {}
  }
  let tree = h.render(component, props)
  assert.ok(find(tree, (n) => n.props?.className?.includes('quick-statement__panel--bottom')))
  find(tree, (n) => n.props?.className === 'quick-statement__mask').props.onClick()
  assert.equal(closed, 1)
  closed = 0
  find(tree, (n) => n.type === 'calculator').props.onChange({ value: '25', operator: '', prev: '' })
  tree = h.render(component, props)
  find(tree, (n) => n.props?.className === 'quick-statement__mask').props.onClick()
  assert.equal(closed, 0)
  find(tree, (n) => n.props?.className === 'quick-statement__close').props.onClick()
  tree = h.render(component, props)
  assert.ok(find(tree, (n) => n.props?.className === 'quick-statement__discard'))
  find(tree, (n) => n.type === 'button' && n.props.title === '继续记账').props.onClick()
  tree = h.render(component, props)
  assert.ok(
    JSON.stringify(
      find(tree, (n) => n.props?.className === 'quick-statement__amount-value')
    ).includes('25')
  )
  assert.equal(
    find(tree, (n) => n.props?.className === 'quick-statement__discard'),
    null
  )
  find(tree, (n) => n.props?.className === 'quick-statement__close').props.onClick()
  tree = h.render(component, props)
  find(tree, (n) => n.type === 'button' && n.props.title === '放弃记录').props.onClick()
  assert.equal(closed, 1)
})

test('suggested entry keeps previous category and asset and exposes the top three live frequent choices', async () => {
  const calls = []
  const selection = (offset = 0) => ({
    data: [
      {
        name: '父类',
        childs: [1, 2, 3, 4].map((id) => ({ id: id + offset, name: `选项${id + offset}` }))
      }
    ],
    frequent: [{ id: 1 + offset }]
  })
  const h = harness({
    '@/jz': {
      storage: { getCurrentAccountBook: () => ({ id: 8 }) },
      api: {
        statements: {
          categoriesWithForm: async () => selection(),
          assetsWithForm: async () => selection(10),
          categoryFrequent: async () => ({ data: [4, 2, 3, 1].map((id) => ({ id })) }),
          assetFrequent: async () => ({ data: [14, 12, 13, 11].map((id) => ({ id })) }),
          create: async (...args) => calls.push(args)
        }
      }
    }
  })
  const component = h.load('src/components/SuggestedStatement/QuickStatementModal.tsx').default
  let closed = 0
  const props = {
    statement: {
      bookId: 8,
      suggestion: { amount: '7.50', source: { type: 'expend', category_id: 1, asset_id: 11 } }
    },
    onClose: () => closed++,
    onSaved: () => {}
  }
  let tree = h.render(component, props)
  h.flush()
  await tick()
  tree = h.render(component, props)
  assert.ok(find(tree, (n) => n.props?.className?.includes('quick-statement__panel--bottom')))
  const selectors = []
  function collect(node, result, predicate) {
    if (Array.isArray(node)) return node.forEach((n) => collect(n, result, predicate))
    if (!node || typeof node !== 'object') return
    if (predicate(node)) result.push(node)
    collect(node.props?.children, result, predicate)
  }
  collect(tree, selectors, (n) => n.props?.className === 'quick-statement__select')
  assert.ok(JSON.stringify(selectors[0]).includes('选项1'))
  assert.ok(JSON.stringify(selectors[1]).includes('选项11'))
  const groups = []
  collect(tree, groups, (n) => n.props?.className === 'quick-statement__frequent')
  const categoryChips = [],
    assetChips = []
  collect(groups[0], categoryChips, (n) => n.props?.className?.startsWith('quick-statement__chip'))
  collect(groups[1], assetChips, (n) => n.props?.className?.startsWith('quick-statement__chip'))
  assert.deepEqual(
    categoryChips.map((n) => n.key),
    ['4', '2', '3']
  )
  assert.deepEqual(
    assetChips.map((n) => n.key),
    ['14', '12', '13']
  )
  categoryChips[0].props.onClick()
  assetChips[0].props.onClick()
  tree = h.render(component, props)
  find(tree, (n) => n.props?.className === 'quick-statement__mask').props.onClick()
  assert.equal(closed, 0)
  await find(tree, (n) => n.type === 'button' && n.props.title === '确定').props.onClick()
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0].category_id, 4)
  assert.equal(calls[0][0].asset_id, 14)
  assert.equal(calls[0][0].amount, 7.5)
})
