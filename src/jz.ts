import Taro from '@tarojs/taro'
import { runTask, UserCancelled } from './utils/async'

import { Api } from './api'
import config from './config'
import Router from './router'
import Storage from './storage'
import { EventEmitter } from './utils/event'

class Jz {
  private static instance: Jz | null = null
  private _event: EventEmitter
  private _appid: string
  private _baseUrl: string
  private _apiUrl: string
  private _api!: Api
  private _router!: Router
  private _storage!: Storage
  systemInfo!: ReturnType<typeof Taro.getSystemInfoSync>

  private constructor() {
    // 私有构造函数，防止外部直接 new
    this._appid = ''
    this._baseUrl = ''
    this._apiUrl = ''
    this._event = new EventEmitter()
  }

  public static getInstance(): Jz {
    if (!Jz.instance) {
      Jz.instance = new Jz()
    }
    return Jz.instance
  }

  bootstrap({ appid = '', baseUrl = '', apiUrl = '' }) {
    this._appid = appid
    this._baseUrl = baseUrl
    this._apiUrl = apiUrl
    this._api = new Api(this.apiUrl)
    this._router = new Router()
    this._storage = new Storage()
    this.systemInfo = Taro.getSystemInfoSync()
    return this
  }

  async initialize() {
    const { data } = await this._api.users.getUserInfo()
    this._storage.setCurrentUser(data.data)
  }

  toastError(content: string, duration = 1500, icon: Taro.showToast.Option['icon'] = 'none') {
    runTask(
      Taro.showToast({
        title: content,
        icon: icon,
        duration: duration
      })
    )
  }

  toastSuccess(content: string, duration = 800, icon: Taro.showToast.Option['icon'] = 'success') {
    runTask(
      Taro.showToast({
        title: content,
        icon: icon,
        duration: duration
      })
    )
  }

  confirm<T = undefined>(text: string, title = '提示', payload?: T) {
    return new Promise<T | undefined>((resolve, reject) => {
      runTask(
        Taro.showModal({
          title: title,
          content: text,
          showCancel: true,
          success: (res) => {
            if (res.confirm) {
              resolve(payload)
            } else if (res.cancel) {
              reject(new UserCancelled())
            }
          },
          fail: () => {
            reject(new Error('无法显示确认弹窗'))
          }
        })
      )
    })
  }

  showNavigatorBack(): boolean {
    if (this._router.getCurrentInstance().router?.path === '/pages/home/index') {
      return false
    }
    return this._router.canNavigateBack()
  }

  async withLoading<T>(promise: Promise<T>): Promise<T> {
    try {
      runTask(Taro.showLoading({ title: '加载中' }))
      return await promise
    } finally {
      Taro.hideLoading()
    }
  }

  async ensureAccountBook() {
    const cached = this.storage.getCurrentAccountBook()
    if (cached?.id) return cached
    const { data } = await this.api.users.getSettingsData()
    this.storage.setCurrentAccountBook(data.user.account_book)
    return data.user.account_book
  }

  get currentUser() {
    return this._storage.getCurrentUser()
  }

  get router(): Router {
    return this._router
  }

  get baseUrl(): string {
    return this._baseUrl
  }

  set baseUrl(url: string) {
    this._baseUrl = url
  }

  get apiUrl(): string {
    return this._apiUrl
  }

  get appId(): string {
    return this._appid
  }

  get api(): Api {
    return this._api
  }

  get storage(): Storage {
    return this._storage
  }

  get event(): EventEmitter {
    return this._event
  }
}

const jz = Jz.getInstance().bootstrap({
  appid: config.appid,
  baseUrl: config.host,
  apiUrl: config.api_url
})

if (process.env.NODE_ENV !== 'production') {
  console.log('运行环境:', process.env.NODE_ENV)
}

export default jz
