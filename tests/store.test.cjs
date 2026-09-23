const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const mobx = require('mobx')
const createLoader = require('./load-source.cjs')

const wallet = {
  header: { total_asset: '100', net_worth: '100', total_liability: '0' },
  list: [],
  amount_visible: true,
  receivables: { name: 'receivables', amount: '0', childs: [] },
  payables: { name: 'payables', amount: '0', childs: [] }
}
function fixture() {
  const saved = [],
    requests = []
  let book = { id: 1, name: 'one' }
  const jz = {
    storage: {
      getCurrentAccountBook: () => book,
      getWalletData: () => '{corrupt cache',
      setWalletData: (data) => saved.push(JSON.parse(data)),
      getCurrentTheme: () => 'default'
    },
    api: {
      finances: {
        index: async () => ({ data: wallet }),
        updateAmountVisible: async (data) => requests.push(data)
      },
      users: {
        getUserInfo: async () => ({ data: { status: 200, data: { hidden_asset_money: true } } })
      }
    }
  }
  const load = createLoader({
    [path.resolve('src/jz.ts')]: jz,
    react: { createContext: (value) => value },
    '@tarojs/taro': { showToast: async () => ({}) }
  })
  return {
    store: load('src/stores/home_store.ts').HomeStoreContext,
    jz,
    saved,
    requests,
    setBook: (value) => {
      book = value
    }
  }
}

test('wallet honors the user privacy setting and not the legacy always-visible wallet flag', async () => {
  const f = fixture()
  await f.store.getFinanceData()
  assert.equal(f.store.financeData.amount_visible, false)
  assert.equal(f.saved[0].amount_visible, false)
  let reactions = 0
  const stop = mobx.autorun(() => {
    f.store.financeData.amount_visible
    reactions++
  })
  await f.store.updateFinanceAmountVisible()
  assert.equal(f.store.financeData.amount_visible, true)
  assert.deepEqual(f.requests, [{ visible: true }])
  assert.equal(reactions, 2)
  stop()
})

test('a wallet response from a previously selected account book is discarded', async () => {
  const f = fixture()
  let resolve
  f.jz.api.finances.index = () =>
    new Promise((done) => {
      resolve = done
    })
  const request = f.store.getFinanceData()
  f.setBook({ id: 2, name: 'two' })
  resolve({ data: wallet })
  await request
  assert.equal(f.saved.length, 0)
  assert.equal(f.store.financeData.header.total_asset, '0')
})

test('visibility API maps visible to the inverse hidden_asset_money field', async () => {
  const load = createLoader()
  const Finance = load('src/api/logic/finance.ts').default
  let body
  const finance = new Finance({
    put: async (_url, data) => {
      body = data
    }
  })
  await finance.updateAmountVisible({ visible: false })
  assert.deepEqual(body, { user: { hidden_asset_money: true } })
})

test('wallet and theme caches keep their wire value types; wallet cache is book-specific', () => {
  const data = new Map()
  const load = createLoader({
    '@tarojs/taro': {
      setStorageSync: (key, value) => data.set(key, value),
      getStorageSync: (key) => data.get(key),
      removeStorageSync: (key) => data.delete(key)
    }
  })
  const Storage = load('src/storage/index.ts').default,
    storage = new Storage()
  storage.setCurrentAccountBook({ id: 1, name: 'one' })
  storage.setWalletData('one wallet')
  storage.setCurrentAccountBook({ id: 2, name: 'two' })
  assert.equal(storage.getWalletData(), null)
  storage.setCurrentAccountBook({ id: 1, name: 'one' })
  assert.equal(storage.getWalletData(), 'one wallet')
})

test('switching account books clears the previous wallet while the next one loads', async () => {
  const f = fixture()
  await f.store.getFinanceData()
  assert.equal(f.store.financeData.header.total_asset, '100')
  let resolve
  f.jz.api.finances.index = () =>
    new Promise((done) => {
      resolve = done
    })
  f.setBook({ id: 2, name: 'two' })
  const request = f.store.getFinanceData()
  assert.equal(f.store.financeData.header.total_asset, '0')
  assert.equal(f.store.financeData.amount_visible, false)
  resolve({ data: wallet })
  await request
})

test('theme changes are observable and cached after the server accepts them', async () => {
  const f = fixture(),
    cached = [],
    observed = []
  f.jz.storage.setCurrentTheme = (theme) => cached.push(theme)
  f.jz.api.users.updateUserInfo = async (body) => f.requests.push(body)
  const stop = mobx.autorun(() => observed.push(f.store.currentTheme))
  const theme = { id: 2, name: '绿色', class_name: 'jz-theme-green' }
  await f.store.updateTheme(theme)
  assert.deepEqual(f.requests, [{ theme_id: 2 }])
  assert.equal(observed.at(-1), 'jz-theme-green')
  assert.equal(f.store.profileData.userInfo.theme_id, 2)
  assert.deepEqual(cached, ['jz-theme-green'])
  stop()
})

test('a rejected theme change preserves the current theme and cache', async () => {
  const f = fixture(),
    cached = []
  f.jz.storage.setCurrentTheme = (theme) => cached.push(theme)
  f.jz.api.users.updateUserInfo = async () => {
    throw new Error('save failed')
  }
  const currentTheme = f.store.currentTheme
  await assert.rejects(
    f.store.updateTheme({ id: 2, name: '绿色', class_name: 'jz-theme-green' }),
    /save failed/
  )
  assert.equal(f.store.currentTheme, currentTheme)
  assert.deepEqual(cached, [])
})

test('a settings response started before theme saving cannot restore the old theme', async () => {
  const f = fixture()
  let resolve
  f.jz.api.users.getSettingsData = () =>
    new Promise((done) => {
      resolve = done
    })
  f.jz.api.users.updateUserInfo = async () => ({})
  f.jz.storage.setCurrentTheme = () => {}
  const pending = f.store.getProfileData()
  await f.store.updateTheme({ id: 2, name: '绿色', class_name: 'jz-theme-green' })
  resolve({ data: { user: { theme: { id: 1, name: '默认', class_name: 'jz-theme-default' } } } })
  await pending
  assert.equal(f.store.currentTheme, 'jz-theme-green')
})
