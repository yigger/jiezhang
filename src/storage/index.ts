import Taro from '@tarojs/taro'
import { isRecord } from '../api/http-result'
import type { HomeSettingsAccountBook, SelectionData, UserProfile } from '../api/types'

export default class Storage {
  private _version = 'v1'

  saveLocal<T>(key: string, value: T, expireDays = 7) {
    const data = {
      value,
      timestamp: Date.now(),
      expireDays
    }
    Taro.setStorageSync(key + '_' + this._version, data)
  }

  getLocal<T>(key: string): T | null {
    const data: unknown = Taro.getStorageSync(key + '_' + this._version)
    if (
      !isRecord(data) ||
      typeof data.timestamp !== 'number' ||
      typeof data.expireDays !== 'number'
    )
      return null

    const { value, timestamp, expireDays } = data
    const now = Date.now()
    const days = (now - timestamp) / (1000 * 60 * 60 * 24)

    if (days > expireDays) {
      this.delLocal(key)
      return null
    }

    return value as T
  }

  delLocal(key: string) {
    Taro.removeStorageSync(key + '_' + this._version)
  }

  setCurrentUser(user: UserProfile) {
    this.saveLocal('currentUser', user)
  }

  getCurrentUser() {
    return this.getLocal<UserProfile>('currentUser')
  }

  getCurrentTheme() {
    return this.getLocal<string>('currentTheme')
  }

  setCurrentTheme(data: string) {
    this.saveLocal('currentTheme', data)
  }

  setAccessToken(data: string) {
    this.saveLocal('accessToken', data)
  }

  getAccessToken() {
    return this.getLocal<string>('accessToken')
  }

  delAccessToken() {
    this.delLocal('accessToken')
  }

  setWalletData(data: string) {
    this.saveLocal(`walletPageData_${this.getCurrentAccountBook()?.id ?? 'unknown'}`, data)
  }

  getWalletData() {
    return this.getLocal<string>(`walletPageData_${this.getCurrentAccountBook()?.id ?? 'unknown'}`)
  }

  setCurrentAccountBook(data: HomeSettingsAccountBook) {
    this.saveLocal('currentAccountBook', data)
  }

  getCurrentAccountBook() {
    return this.getLocal<HomeSettingsAccountBook>('currentAccountBook')
  }

  setStatementCategories(type: string, data: SelectionData) {
    const cacheAB = this.getCurrentAccountBook()
    if (cacheAB) {
      this.saveLocal(`currentCategories_${type}_${cacheAB.id}`, data)
    } else {
      return null
    }
  }

  getStatementCategories(type: string) {
    const cacheAB = this.getCurrentAccountBook()
    if (cacheAB) {
      return this.getLocal<SelectionData>(`currentCategories_${type}_${cacheAB.id}`)
    } else {
      return null
    }
  }

  setStatementAssets(data: SelectionData) {
    const cacheAB = this.getCurrentAccountBook()
    if (cacheAB) {
      this.saveLocal(`currentAssets_${cacheAB.id}`, data)
    } else {
      return null
    }
  }

  getStatementAssets() {
    const cacheAB = this.getCurrentAccountBook()
    if (cacheAB) {
      return this.getLocal<SelectionData>(`currentAssets_${cacheAB.id}`)
    } else {
      return null
    }
  }

  delStatementCategories() {
    const cacheAB = this.getCurrentAccountBook()
    if (cacheAB) {
      this.delLocal(`currentCategories_expend_${cacheAB.id}`)
      this.delLocal(`currentCategories_income_${cacheAB.id}`)
    } else {
      return null
    }
  }

  delStatementAssets() {
    const cacheAB = this.getCurrentAccountBook()
    if (cacheAB) {
      this.delLocal(`currentAssets_${cacheAB.id}`)
    } else {
      return null
    }
  }
}
