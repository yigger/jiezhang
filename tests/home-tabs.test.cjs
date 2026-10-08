const test = require('node:test')
const assert = require('node:assert/strict')
const createLoader = require('./load-source.cjs')
const { normalizeHomeTabs, moveHomeTab, defaultHomeTabIDs } =
  createLoader()('src/utils/home-tabs.ts')

test('navigation includes projects by default and validates persisted configuration', () => {
  assert.deepEqual(normalizeHomeTabs(null), ['index', 'statistic', 'project', 'asset', 'profile'])
  assert.deepEqual(normalizeHomeTabs(['asset', 'asset', 'missing', 5, 'index', 'profile']), [
    'asset',
    'index',
    'profile'
  ])
  assert.deepEqual(normalizeHomeTabs(['project']), ['index', 'project', 'profile'])
  assert.deepEqual(normalizeHomeTabs([]), defaultHomeTabIDs)
  assert.deepEqual(normalizeHomeTabs(['unknown']), defaultHomeTabIDs)
})
test('navigation reordering preserves enabled entries and respects boundaries', () => {
  const order = ['index', 'project', 'asset', 'profile']
  assert.deepEqual(moveHomeTab(order, 'project', 1), ['index', 'asset', 'project', 'profile'])
  assert.deepEqual(moveHomeTab(order, 'index', -1), order)
  assert.deepEqual(moveHomeTab(order, 'profile', 1), order)
  assert.deepEqual(order, ['index', 'project', 'asset', 'profile'])
})
test('navigation preferences persist without expiry and remain isolated per user', () => {
  const values = new Map()
  const load = createLoader({
    '@tarojs/taro': {
      getStorageSync: (key) => values.get(key),
      setStorageSync: (key, value) => values.set(key, value),
      removeStorageSync: (key) => values.delete(key)
    }
  })
  const Storage = load('src/storage/index.ts').default
  const storage = new Storage()
  storage.setCurrentUser({ id: 1 })
  storage.setHomeTabs(['index', 'project', 'profile'])
  assert.deepEqual(new Storage().getHomeTabs(), ['index', 'project', 'profile'])
  storage.setCurrentUser({ id: 2 })
  assert.deepEqual(storage.getHomeTabs(), defaultHomeTabIDs)
  storage.setHomeTabs(['index', 'asset', 'profile'])
  storage.setCurrentUser({ id: 1 })
  assert.deepEqual(storage.getHomeTabs(), ['index', 'project', 'profile'])
  assert.deepEqual(values.get('homeTabs_v1_1'), ['index', 'project', 'profile'])
})
