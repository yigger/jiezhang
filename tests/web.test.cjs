const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const createLoader = require('./load-source.cjs')

// Run the platform branch in its own process so other suites keep their WeChat environment.
if (process.env.TARO_ENV !== 'h5') {
  test('browser authentication and platform behavior', () => {
    const env = { ...process.env, TARO_ENV: 'h5' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(process.execPath, ['--test', __filename], {
      env,
      encoding: 'utf8',
      timeout: 60000
    })
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.match(result.stdout, /Web startup loads src\/app.ts/)
  })
} else {
  for (const entry of ['src/app.ts', 'src/api/request.ts', 'src/api/index.ts', 'src/jz.ts']) {
    test(`Web startup loads ${entry} with real application modules`, async () => {
      const storage = new Map()
      const calls = []
      const load = createLoader({
        [path.resolve('src/utils/web-session.ts')]: { prepareWebLaunch() {} },
        '@tarojs/taro': {
          getSystemInfoSync: () => ({ statusBarHeight: NaN }),
          getStorageSync: (key) => storage.get(key),
          setStorageSync: (key, value) => storage.set(key, value),
          removeStorageSync: (key) => storage.delete(key),
          eventCenter: { on() {}, off() {}, trigger() {} },
          login: () => assert.fail('Web startup must not call WeChat login'),
          request: async (options) => {
            calls.push(options)
            return { statusCode: 200, data: { status: 200, data: { id: 1 } } }
          }
        },
        '@tarojs/components': { View: 'view', Text: 'text', Input: 'input', Button: 'button' },
        [path.resolve('src/config/index.ts')]: {
          appid: 'startup-app',
          host: '',
          api_url: '/api',
          web_auth_mode: 'development'
        }
      })
      load(entry)
      const jz = load('src/jz.ts').default
      const Request = load('src/api/request.ts').default
      const { Api } = load('src/api/index.ts')
      assert.ok(jz.api instanceof Api)
      assert.ok(jz.api instanceof Request)
      assert.equal(jz.api.storage, jz.storage)
      assert.equal(jz.api.appId, 'startup-app')
      await jz.initialize()
      assert.equal(jz.currentUser.id, 1)
      assert.equal(jz.systemInfo.statusBarHeight, 0)
      assert.equal(calls[0].url, '/api/users')
      assert.equal(calls[0].header['X-WX-APP-ID'], 'startup-app')
      assert.equal(calls[0].header['X-WX-Skey'], '')
    })
  }

  function fixture(mode = 'session') {
    const storage = new Map()
    const calls = []
    const events = []
    const listeners = new Map()
    const taro = {
      getStorageSync: (key) => storage.get(key),
      setStorageSync: (key, value) => storage.set(key, value),
      removeStorageSync: (key) => storage.delete(key),
      eventCenter: {
        on: (event, callback) => listeners.set(event, callback),
        off: (event) => listeners.delete(event),
        trigger: (event) => {
          events.push(event)
          listeners.get(event)?.()
        }
      },
      login: () => assert.fail('browser must never call WeChat login'),
      request: async (options) => {
        calls.push(options)
        return { statusCode: 200, data: { id: 1 } }
      },
      uploadFile: async (options) => {
        calls.push(options)
        return { statusCode: 200, data: '{}' }
      }
    }
    const load = createLoader({
      '@tarojs/taro': taro,
      [path.resolve('src/config/index.ts')]: { appid: 'app', web_auth_mode: mode }
    })
    const { default: Request, RequestManager, WebAuthRequired } = load('src/api/request.ts')
    return {
      taro,
      storage,
      calls,
      events,
      load,
      RequestManager,
      WebAuthRequired,
      request: new Request('/api')
    }
  }

  test('local Web development requests and uploads use backend development authentication', async () => {
    const f = fixture('development')
    await f.request.get('users')
    await f.request.upload('blob:avatar', { type: 'user_avatar' })
    assert.equal(f.calls.length, 2)
    assert.equal(f.calls[0].url, '/api/users')
    assert.ok(f.calls.every((call) => call.header['X-WX-Skey'] === ''))
    assert.equal(f.storage.size, 0)
  })

  test('production Web without a Session blocks network requests and requests login', async () => {
    const f = fixture()
    await assert.rejects(f.request.get('users'), f.WebAuthRequired)
    assert.equal(f.calls.length, 0)
    assert.deepEqual(f.events, ['web:auth-required'])
  })

  test('Web Session cache is isolated by platform, endpoint, AppID and expiration', async () => {
    const f = fixture()
    f.storage.set(
      'access_token_data',
      JSON.stringify({ token: 'mini', expireTime: Date.now() + 50000, scope: '/api|app' })
    )
    await assert.rejects(f.request.getAccessToken(), f.WebAuthRequired)
    f.RequestManager.saveSession('/api', 'app', ' session ')
    assert.equal(await f.request.getAccessToken(), 'session')
    assert.equal(f.RequestManager.getStoredSession('/api/', 'app'), 'session')
    assert.equal(f.RequestManager.getStoredSession('/other', 'app'), null)
    assert.equal(f.RequestManager.getStoredSession('/api', 'other'), null)
    const stored = JSON.parse(f.storage.get('access_token_data'))
    stored.expireTime = 0
    f.storage.set('access_token_data', JSON.stringify(stored))
    await assert.rejects(f.request.getAccessToken(), f.WebAuthRequired)
  })

  test('rejected Web sessions clear credentials without replaying writes or calling WeChat', async () => {
    for (const response of [
      { statusCode: 200, data: { status: 301 } },
      { statusCode: 401, data: {} }
    ]) {
      const f = fixture()
      f.RequestManager.saveSession('/api', 'app', 'expired')
      let writes = 0
      f.taro.request = async () => {
        writes++
        return response
      }
      await assert.rejects(f.request.post('statements', {}), f.WebAuthRequired)
      assert.equal(writes, 1)
      assert.equal(f.RequestManager.getStoredSession('/api', 'app'), null)
    }
  })

  test('upload session rejection returns to Web login and is not replayed', async () => {
    const f = fixture()
    f.RequestManager.saveSession('/api', 'app', 'expired')
    f.taro.uploadFile = async (options) => {
      f.calls.push(options)
      return { statusCode: 200, data: '{"status":301}' }
    }
    await assert.rejects(f.request.upload('blob:avatar', {}), f.WebAuthRequired)
    assert.equal(f.calls.length, 1)
    assert.equal(f.RequestManager.getStoredSession('/api', 'app'), null)
  })

  test('browser permission failures do not discard valid sessions', async () => {
    const f = fixture()
    f.RequestManager.saveSession('/api', 'app', 'valid')
    f.taro.request = async () => ({ statusCode: 403, data: { msg: 'forbidden' } })
    await assert.rejects(f.request.get('users'), /forbidden/)
    assert.equal(await f.request.getAccessToken(), 'valid')
    assert.deepEqual(f.events, [])
  })

  test('production configuration never enables development authentication', () => {
    const original = {
      NODE_ENV: process.env.NODE_ENV,
      JZ_WEB_AUTH_MODE: process.env.JZ_WEB_AUTH_MODE
    }
    try {
      process.env.NODE_ENV = 'production'
      process.env.JZ_WEB_AUTH_MODE = 'development'
      const load = createLoader({
        [path.resolve('src/config/config.ts')]: {
          appid: 'app',
          dev_host: 'http://dev',
          production_host: 'https://prod',
          web_host: 'https://web'
        }
      })
      const config = load('src/config/index.ts').default
      assert.equal(config.web_auth_mode, 'session')
      assert.equal(config.api_url, '/api')
    } finally {
      for (const [key, value] of Object.entries(original)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }
  })

  test('browser sharing preserves the deployment path and encoded route parameters', () => {
    const previous = global.window
    try {
      global.window = {
        location: { href: 'https://example.test/jiezhang/?old=1#/pages/home/index' }
      }
      const { webPageUrl } = fixture().load('src/utils/web.ts')
      assert.equal(
        webPageUrl('/pages/share/public?token=a%2Bb%2Fc'),
        'https://example.test/jiezhang/#/pages/share/public?token=a%2Bb%2Fc'
      )
    } finally {
      global.window = previous
    }
  })

  test('browser editable dialogs return typed content and respect cancellation', async () => {
    const previous = global.window
    try {
      const { showModal } = fixture().load('src/utils/modal.ts')
      global.window = { prompt: () => '昵称' }
      const confirmed = await showModal({ editable: true, title: '编辑昵称' })
      assert.equal(confirmed.content, '昵称')
      assert.equal(confirmed.confirm, true)
      global.window.prompt = () => null
      const cancelled = await showModal({ editable: true })
      assert.equal(cancelled.cancel, true)
      assert.equal(cancelled.confirm, false)
    } finally {
      global.window = previous
    }
  })

  test('browser system information cannot pass NaN into header layout', () => {
    const load = createLoader({
      '@tarojs/taro': { getSystemInfoSync: () => ({ statusBarHeight: NaN }) },
      [path.resolve('src/api/index.ts')]: { Api: class {} },
      [path.resolve('src/router/index.ts')]: class {},
      [path.resolve('src/storage/index.ts')]: class {},
      [path.resolve('src/config/index.ts')]: { appid: 'app', host: '', api_url: '/api' }
    })
    const jz = load('src/jz.ts').default
    assert.equal(jz.systemInfo.statusBarHeight, 0)
  })

  function gateHarness(f, mode) {
    const React = require('react')
    const slots = []
    const effects = []
    const cleanups = []
    let cursor = 0
    let navigationCount = 0
    const onReady = async () => {
      navigationCount++
    }
    const hooks = {
      ...React,
      useState(initial) {
        const index = cursor++
        if (!(index in slots)) slots[index] = initial
        return [
          slots[index],
          (value) => {
            slots[index] = value
          }
        ]
      },
      useRef(initial) {
        const index = cursor++
        if (!(index in slots)) slots[index] = { current: initial }
        return slots[index]
      },
      useCallback(callback) {
        const index = cursor++
        if (!(index in slots)) slots[index] = callback
        return slots[index]
      },
      useEffect(callback) {
        const index = cursor++
        if (!(index in slots)) effects.push(callback)
        slots[index] = true
      }
    }
    const load = createLoader({
      react: hooks,
      '@tarojs/taro': f.taro,
      '@tarojs/components': { View: 'view', Text: 'text', Input: 'input', Button: 'button' },
      [path.resolve('src/config/index.ts')]: { web_auth_mode: mode },
      [path.resolve('src/api/request.ts')]: {
        RequestManager: f.RequestManager,
        WEB_AUTH_REQUIRED: 'web:auth-required'
      },
      [path.resolve('src/jz.ts')]: {
        appId: 'app',
        apiUrl: '/api',
        initialize: () => f.request.get('users')
      }
    })
    const component = load('src/components/WebSessionGate/index.tsx').default
    return {
      render() {
        cursor = 0
        return component({ onReady })
      },
      get navigationCount() {
        return navigationCount
      },
      flush() {
        effects.splice(0).forEach((effect) => cleanups.push(effect()))
      },
      cleanup() {
        cleanups.forEach((cleanup) => cleanup?.())
      }
    }
  }

  function findElement(node, type) {
    if (Array.isArray(node)) {
      for (const child of node) {
        const result = findElement(child, type)
        if (result) return result
      }
    }
    if (!node || typeof node !== 'object') return null
    return node.type === type ? node : findElement(node.props?.children, type)
  }
  const tick = () => new Promise((resolve) => setImmediate(resolve))

  test('Web login page navigates only after session validation', async () => {
    const f = fixture()
    const gate = gateHarness(f, 'session')
    gate.render()
    gate.flush()
    await tick()
    let tree = gate.render()
    assert.equal(tree.props.className, 'web-session-gate')
    assert.equal(f.calls.length, 0)
    findElement(tree, 'input').props.onInput({ detail: { value: 'valid-session' } })
    tree = gate.render()
    findElement(tree, 'button').props.onClick()
    await tick()
    tree = gate.render()
    assert.equal(gate.navigationCount, 1)
    assert.equal(f.calls[0].header['X-WX-Skey'], 'valid-session')
    f.taro.request = async () => ({ statusCode: 200, data: { status: 301 } })
    await assert.rejects(f.request.get('header'), f.WebAuthRequired)
    assert.equal(gate.render().props.className, 'web-session-gate')
    gate.cleanup()
  })

  test('Web development connection failure keeps private pages closed and retry can recover', async () => {
    const f = fixture('development')
    const success = f.taro.request
    f.taro.request = async () => {
      throw new Error('offline')
    }
    const gate = gateHarness(f, 'development')
    gate.render()
    gate.flush()
    await tick()
    let tree = gate.render()
    assert.equal(tree.props.className, 'web-session-gate')
    f.taro.request = success
    findElement(tree, 'button').props.onClick()
    await tick()
    tree = gate.render()
    assert.equal(gate.navigationCount, 1)
    gate.cleanup()
  })
}
