import Taro from '@tarojs/taro'
import { runTask } from '../utils/async'

interface RouterOptions {
  url: string
  name?: string
  params?: Record<string, string | number | boolean | undefined>
}

export default class Router {
  private _beforeHooks: Array<(to: string) => boolean | Promise<boolean>>

  constructor() {
    this._beforeHooks = []
  }

  getParams() {
    return this.getCurrentInstance().router?.params || {}
  }

  getCurrentInstance() {
    return Taro.getCurrentInstance()
  }

  // 获取当前页面栈
  getCurrentPages() {
    return Taro.getCurrentPages()
  }

  // 获取当前页面路径
  getCurrentPage() {
    const pages = this.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    return currentPage ? `/${currentPage.route}` : ''
  }

  // 构建带参数的URL
  private buildUrl({ url, params }: RouterOptions): string {
    if (!params) return url
    const query = Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&')
    return `${url}${url.includes('?') ? '&' : '?'}${query}`
  }

  // 添加路由守卫
  beforeEach(callback: (to: string) => boolean | Promise<boolean>) {
    this._beforeHooks.push(callback)
  }

  // 执行路由守卫
  private async runBeforeHooks(to: string): Promise<boolean> {
    for (const hook of this._beforeHooks) {
      const result = await hook(to)
      if (!result) return false
    }
    return true
  }

  async navigateTo(options: RouterOptions) {
    try {
      const url = this.buildUrl(options)
      if (!(await this.runBeforeHooks(url))) {
        return false
      }

      await Taro.navigateTo({ url })
      return true
    } catch (error) {
      console.error('页面跳转失败:', error)
      return false
    }
  }

  async redirectTo(options: RouterOptions) {
    try {
      const url = this.buildUrl(options)
      if (!(await this.runBeforeHooks(url))) {
        return false
      }

      await Taro.redirectTo({ url })
      return true
    } catch (error) {
      console.error('页面重定向失败:', error)
      return false
    }
  }

  navigateBack(delta = 1) {
    const pages = this.getCurrentPages()
    if (pages.length > 1) {
      runTask(Taro.navigateBack({ delta }))
      return true
    } else {
      console.warn('已经是第一个页面')
      return false
    }
  }

  // 检查是否可以返回
  canNavigateBack(): boolean {
    return this.getCurrentPages().length > 1
  }
}
