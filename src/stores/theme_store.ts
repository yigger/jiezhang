import {observable, action} from 'mobx';
import jz from '@/jz'
import { createContext } from "react";

class ThemeStore {
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

  @action setTheme(theme) {
    this.currentTheme = theme
  }
}

export const ThemeStoreContext = createContext(new ThemeStore());