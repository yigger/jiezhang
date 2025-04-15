import { Component } from 'react'
import Taro from "@tarojs/taro"
import jz from './jz'

class App extends Component {
  onLaunch () {
    const updateManager = Taro.getUpdateManager()
    updateManager.onCheckForUpdate(function () {
    })

    updateManager.onUpdateReady(function () {
      Taro.showModal({
        title: '洁账版本升级',
        content: '版本已更新，请重启应用后使用',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
      }
      })
    })

    jz.initialize()
  }

  // this.props.children 是将要会渲染的页面
  render () {
    return this.props.children
  }
}

export default App
