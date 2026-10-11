import Taro from '@tarojs/taro'
import type { PropsWithChildren } from 'react'
import { Component } from 'react'
import { WEB_AUTH_REQUIRED } from './api/request'
import jz from './jz'
import { runTask } from './utils/async'
import { prepareWebLaunch, requireWebLogin } from './utils/web-session'

// Run before Taro creates its hash history, including when opening a deep link.
if (process.env.TARO_ENV === 'h5') prepareWebLaunch()

class App extends Component<PropsWithChildren> {
  private requireLogin = () => runTask(requireWebLogin())

  onLaunch() {
    if (process.env.TARO_ENV === 'h5') {
      Taro.eventCenter.on(WEB_AUTH_REQUIRED, this.requireLogin)
    }
    if (process.env.TARO_ENV === 'weapp') {
      const updateManager = Taro.getUpdateManager()

      updateManager.onUpdateReady(function () {
        runTask(
          Taro.showModal({
            title: '洁账版本升级',
            content: '版本已更新，请重启应用后使用',
            success(res) {
              if (res.confirm) {
                updateManager.applyUpdate()
              }
            }
          })
        )
      })
    }
    if (process.env.TARO_ENV !== 'h5') runTask(jz.initialize())
  }

  componentWillUnmount() {
    if (process.env.TARO_ENV === 'h5') {
      Taro.eventCenter.off(WEB_AUTH_REQUIRED, this.requireLogin)
    }
  }

  // this.props.children 是将要会渲染的页面
  render() {
    return this.props.children
  }
}

export default App
