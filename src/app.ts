import Taro from '@tarojs/taro'
import type { PropsWithChildren } from 'react'
import { Component } from 'react'
import jz from './jz'
import { runTask } from './utils/async'

class App extends Component<PropsWithChildren> {
  onLaunch() {
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
    runTask(jz.initialize())
  }

  // this.props.children 是将要会渲染的页面
  render() {
    return this.props.children
  }
}

export default App
