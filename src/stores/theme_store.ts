import { action, makeObservable, observable } from 'mobx'
import { createContext } from 'react'

class ThemeStore {
  constructor() {
    makeObservable(this)
  }

  themes = [
    {
      name: '默认主题',
      value: 'default'
    },
    {
      name: '纯净白',
      value: 'pure'
    },
    {
      name: '樱花粉',
      value: 'pink'
    },
    {
      name: '黑夜模式',
      value: 'black'
    }
  ]

  // 初始化的默认主题
  // value: default, pink, pure
  @observable currentTheme = this.themes[3]

  @action setTheme(theme: { name: string; value: string }) {
    this.currentTheme = theme
  }
}

export const ThemeStoreContext = createContext(new ThemeStore())
