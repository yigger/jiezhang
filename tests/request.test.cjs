const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const createLoader = require('./load-source.cjs')

function fixture() {
  const storage = new Map()
  let logins = 0,
    authentications = 0
  const calls = []
  const taro = {
    getStorageSync: (key) => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value),
    removeStorageSync: (key) => storage.delete(key),
    login: async () => {
      logins++
      return { code: 'code' }
    },
    request: async (options) => {
      calls.push(options)
      if (options.url.endsWith('/check_openid')) {
        authentications++
        return { statusCode: 200, data: { session: `token-${authentications}` } }
      }
      return { statusCode: 200, data: { id: 1 } }
    }
  }
  const load = createLoader({
    '@tarojs/taro': taro,
    [path.resolve('src/jz.ts')]: { appId: 'app' }
  })
  const { default: Request, RequestManager } = load('src/api/request.ts')
  return {
    taro,
    storage,
    calls,
    RequestManager,
    request: new Request('https://api.example.test/'),
    counts: () => ({ logins, authentications })
  }
}

test('concurrent login requests share a single flight; valid cache skips Taro.login', async () => {
  const f = fixture()
  const tokens = await Promise.all(Array.from({ length: 8 }, () => f.request.getAccessToken()))
  assert.deepEqual(new Set(tokens), new Set(['token-1']))
  await f.request.getAccessToken()
  assert.deepEqual(f.counts(), { logins: 1, authentications: 1 })
})

test('expired cache triggers a new authentication instead of reusing a settled promise', async () => {
  const f = fixture()
  await f.request.getAccessToken()
  const value = JSON.parse(f.storage.get('access_token_data'))
  value.expireTime = 0
  f.storage.set('access_token_data', JSON.stringify(value))
  assert.equal(await f.request.getAccessToken(), 'token-2')
})

test('corrupt cache and failed authentication do not poison future logins', async () => {
  const f = fixture()
  f.storage.set('access_token_data', '{broken')
  const login = f.taro.login
  f.taro.login = async () => {
    throw new Error('offline')
  }
  await assert.rejects(f.request.getAccessToken(), /offline/)
  f.taro.login = login
  assert.equal(await f.request.getAccessToken(), 'token-1')
})

test('network failure never replays a write that might already have committed', async () => {
  const f = fixture()
  await f.request.getAccessToken()
  let writes = 0
  f.taro.request = async () => {
    writes++
    throw new Error('response lost')
  }
  await assert.rejects(f.request.post('statements', { amount: 10 }), /response lost/)
  assert.equal(writes, 1)
})

test('HTTP 200 business failures reject without returning typed success data', async () => {
  for (const data of [
    { status: 500, msg: 'denied' },
    { status: 'error', message: 'denied' }
  ]) {
    const f = fixture()
    await f.request.getAccessToken()
    f.taro.request = async () => ({ statusCode: 200, data })
    await assert.rejects(f.request.post('statements', {}), /denied/)
  }
})

test('explicit expired session is refreshed once and retries with a new token', async () => {
  const f = fixture()
  const request = f.taro.request
  let businessCalls = 0
  f.taro.request = async (options) => {
    if (options.url.endsWith('/check_openid')) return request(options)
    businessCalls++
    if (businessCalls === 1) return { statusCode: 200, data: { status: 301 } }
    assert.equal(options.header['X-WX-Skey'], 'token-2')
    return { statusCode: 200, data: { id: 5 } }
  }
  assert.equal((await f.request.get('/statements/5')).data.id, 5)
  assert.equal(businessCalls, 2)
})

test('repeated session rejection terminates with an error, never a null result', async () => {
  const f = fixture()
  const request = f.taro.request
  let businessCalls = 0
  f.taro.request = async (options) => {
    if (options.url.endsWith('/check_openid')) return request(options)
    businessCalls++
    return { statusCode: 200, data: { status: 301, msg: 'session expired' } }
  }
  await assert.rejects(f.request.get('header'), /session expired/)
  assert.equal(businessCalls, 2)
})

test('cached sessions are isolated by endpoint and app id', async () => {
  const f = fixture()
  await f.RequestManager.get('https://one.test', 'one')
  await f.RequestManager.get('https://two.test', 'two')
  assert.deepEqual(f.counts(), { logins: 2, authentications: 2 })
})
