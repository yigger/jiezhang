const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const createLoader = require('./load-source.cjs')

if (process.env.TARO_ENV !== 'h5' || process.env.TARO_PLATFORM !== 'web') {
  test('Taro Web page mounting and login lifecycle', () => {
    const env = { ...process.env, TARO_ENV: 'h5', TARO_PLATFORM: 'web' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(process.execPath, ['--test', __filename], {
      env,
      encoding: 'utf8',
      timeout: 60000
    })
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.match(result.stdout, /real Taro pages mount/)
  })
} else {
  test('real Taro pages mount while login is pending and receive lifecycle hooks after login', async () => {
    const { JSDOM } = require('jsdom')
    const dom = new JSDOM('<div id="app"></div>', {
      url: 'http://localhost/jiezhang/#/pages/project/detail?id=7&name=a%2Bb',
      pretendToBeVisual: true
    })
    const previousGlobals = new Map()
    for (const key of [
      'window',
      'document',
      'navigator',
      'HTMLElement',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'IS_REACT_ACT_ENVIRONMENT'
    ]) {
      previousGlobals.set(key, Object.getOwnPropertyDescriptor(global, key))
      const value =
        key === 'IS_REACT_ACT_ENVIRONMENT'
          ? true
          : key.includes('AnimationFrame')
            ? dom.window[key].bind(dom.window)
            : dom.window[key]
      Object.defineProperty(global, key, { configurable: true, writable: true, value })
    }

    const React = require('react')
    const ReactDOM = require('react-dom')
    const { createRoot } = require('react-dom/client')
    const runtime = require('@tarojs/runtime')
    const framework = require('@tarojs/plugin-framework-react/dist/runtime.js')
    const storage = new Map()
    const eventCenter = runtime.eventCenter
    const config = { web_auth_mode: 'development', appid: 'app' }
    let initializationCount = 0
    let resolveUser
    let root
    let page
    let pageMounted
    let privateMounts = 0
    let shows = 0
    let nextPageId = 0
    const navigation = []
    const jz = {
      appId: 'app',
      apiUrl: '/api',
      router: { getParams: () => runtime.Current.router?.params || {} },
      initialize: () => {
        initializationCount++
        if (initializationCount === 1) return Promise.reject(new Error('offline'))
        return new Promise((resolve) => {
          resolveUser = resolve
        })
      }
    }
    let LoginPage
    function PrivatePage() {
      framework.useDidShow(() => shows++)
      React.useEffect(() => {
        privateMounts++
      }, [])
      return React.createElement('div', { id: 'private-content' }, 'account book')
    }
    const navigate = ({ url }) => {
      navigation.push(url)
      page?.onUnload()
      const [pathname, query = ''] = url.split('?')
      // Taro keeps route query values encoded until the application consumes them.
      const params = Object.fromEntries(
        query
          .split('&')
          .filter(Boolean)
          .map((p) => p.split('='))
      )
      page = runtime.createPageConfig(
        pathname === '/pages/web_login/index' ? LoginPage : PrivatePage,
        `${pathname}?testPage=${++nextPageId}`
      )
      pageMounted = new Promise((resolve) => {
        page.onLoad(params, () => {
          page.onShow()
          resolve()
        })
      })
      return pageMounted
    }
    const taro = {
      eventCenter,
      getStorageSync: (key) => storage.get(key),
      setStorageSync: (key, value) => storage.set(key, value),
      removeStorageSync: (key) => storage.delete(key),
      reLaunch: navigate,
      showToast: () => assert.fail('startup must not report an unhandled error')
    }
    const load = createLoader({
      '@tarojs/taro': taro,
      '@tarojs/components': {
        View: 'div',
        Text: 'span',
        Input: ({ password, onInput, onConfirm: _onConfirm, ...props }) =>
          React.createElement('input', {
            ...props,
            type: password ? 'password' : 'text',
            onChange: (event) => onInput({ detail: { value: event.target.value } })
          }),
        Button: ({ loading: _loading, ...props }) => React.createElement('button', props)
      },
      [path.resolve('src/config/index.ts')]: config,
      [path.resolve('src/jz.ts')]: jz
    })
    const flush = () => React.act(async () => new Promise((resolve) => setImmediate(resolve)))
    try {
      const App = load('src/app.ts').default
      LoginPage = load('src/pages/web_login/index.tsx').default
      const { getWebReturnUrl, prepareWebLaunch, requireWebLogin, webLoginUrl } = load(
        'src/utils/web-session.ts'
      )
      const deepLink = '/pages/project/detail?id=7&name=a%2Bb'
      assert.equal(window.location.hash, '#' + webLoginUrl(deepLink))
      assert.equal(window.location.pathname, '/jiezhang/')
      prepareWebLaunch()
      assert.equal(window.location.hash, '#' + webLoginUrl(deepLink))
      assert.equal(getWebReturnUrl(encodeURIComponent(deepLink)), deepLink)
      for (const invalid of [
        'https://other.test',
        '/pages/unknown',
        '/pages/web_login/index',
        '%'
      ]) {
        assert.equal(getWebReturnUrl(invalid), '/pages/home/index')
      }

      await React.act(async () => {
        const app = framework.createReactApp(
          App,
          React,
          {
            ...ReactDOM,
            createRoot(container) {
              root = createRoot(container)
              return root
            }
          },
          {}
        )
        app.onLaunch({})
      })
      await React.act(async () => {
        void navigate({ url: window.location.hash.slice(1) })
      })
      await pageMounted
      assert.ok(document.getElementById(page.$taroPath), 'Taro must find its page DOM')
      assert.match(document.querySelector('.web-session-error').textContent, /offline/)
      assert.equal(privateMounts, 0)

      await React.act(async () => {
        document.querySelector('button').click()
      })
      assert.ok(document.getElementById(page.$taroPath), 'waiting must preserve the page DOM')
      assert.equal(document.querySelector('button').disabled, true)
      assert.equal(privateMounts, 0)
      await React.act(async () => resolveUser())
      await flush()
      await pageMounted
      assert.equal(navigation.at(-1), deepLink)
      assert.ok(document.getElementById('private-content'))
      assert.equal(privateMounts, 1)
      assert.equal(shows, 1, 'private page must receive its initial Taro onShow')

      // A rejected Session should clear the page stack and mount a real login page.
      config.web_auth_mode = 'session'
      await React.act(async () => {
        window.history.replaceState(null, '', '#' + deepLink)
        eventCenter.trigger('web:auth-required')
        void requireWebLogin()
      })
      await pageMounted
      assert.equal(navigation.at(-1), webLoginUrl(deepLink))
      assert.equal(navigation.length, 3, 'concurrent auth failures must share one redirect')
      assert.ok(document.getElementById(page.$taroPath))
      assert.equal(document.getElementById('private-content'), null)
      assert.ok(document.querySelector('input'))
      assert.equal(initializationCount, 2)
    } finally {
      await React.act(async () => root?.unmount())
      dom.window.close()
      for (const [key, descriptor] of previousGlobals) {
        if (descriptor) Object.defineProperty(global, key, descriptor)
        else delete global[key]
      }
    }
  })
}
