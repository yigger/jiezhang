import Taro from "@tarojs/taro"

import { Api } from './api'
import Router from './router'
import Storage from './storage'
import config from './config'

class Jz {
  private static instance: Jz | null = null;
  private _appid: string
  private _baseUrl: string
  private _apiUrl: string
  private _api: Api
  private _router: Router
  private _storage: Storage
  systemInfo: any

  private constructor() {
    // 私有构造函数，防止外部直接 new
    this._appid = ''
    this._baseUrl = ''
    this._apiUrl = ''
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
    // 初始化用户和账簿信息
    this._api.users.getUserInfo().then(res => {
      const data = res.data
      if (data?.status === 200) {
        console.log('当前用户信息:', data.data)
        this._storage.setCurrentUser(data.data)
      }
    })
  }

  toastError(content: string, duration = 1500, icon = 'none') {
    Taro.showToast({
      title: content,
      icon: icon,
      duration: duration
    })
  }

  toastSuccess(content: string, duration = 800, icon = 'success') {
    Taro.showToast({
      title: content,
      icon: icon,
      duration: duration
    })
  }

  confirm(text, title='提示', payload={}) {
    return new Promise((resolve, reject) => {
      Taro.showModal({
        title: title,
        content: text,
        showCancel: true,
        success: res => {
          if (res.confirm) {
            resolve(payload);
          } else if (res.cancel) {
            reject(payload);
          }
        },
        fail: res => {
          reject(payload);
        }
      });
    })
  }

  showNavigatorBack(): boolean {
    if (this._router.getCurrentInstance().router.path === '/pages/home/index') {
      return false
    }
    return this._router.canNavigateBack()
  }

  async withLoading<T>(promise: Promise<T>): Promise<T> {
    try {
      Taro.showLoading({title: "加载中"})
      return await promise
    } finally {
      Taro.hideLoading()
    }
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
}

const jz = Jz.getInstance().bootstrap({
  appid: config.appid,
  baseUrl: config.host,
  apiUrl: config.api_url
})

if (process.env.NODE_ENV !== 'production') {
  console.log("运行环境:", process.env.NODE_ENV)
  console.log("配置初始化", jz)
}

export default jz