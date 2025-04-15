import Taro from "@tarojs/taro"

export default class Storage {
  private _version = 'v1'

  saveLocal(key, value, expireDays = 7) {
    const data = {
      value,
      timestamp: Date.now(),
      expireDays
    }
    Taro.setStorage({
      key: key + '_' + this._version,
      data
    })
  }

  getLocal(key) {
    const data = Taro.getStorageSync(key + '_' + this._version)
    if (!data) return null
    
    const { value, timestamp, expireDays } = data
    const now = Date.now()
    const days = (now - timestamp) / (1000 * 60 * 60 * 24)
    
    if (days > expireDays) {
      this.delLocal(key)
      return null
    }
    
    return value
  }

  delLocal(key) {
    Taro.removeStorageSync(key + '_' + this._version)
  }

  setCurrentUser(user) {
    this.saveLocal('currentUser', user)
  }

  getCurrentUser() {
    return this.getLocal('currentUser')
  }

  getCurrentTheme() {
    return this.getLocal('currentTheme')
  }

  setCurrentTheme(data) {
    this.saveLocal('currentTheme', data)
  }

  setAccessToken(data) {
    this.saveLocal('accessToken', data)
  }

  getAccessToken() {
    return this.getLocal('accessToken')
  }

  delAccessToken() {
    this.delLocal('accessToken')
  }

  setWalletData(data) {
    this.saveLocal('walletPageData', data)
  }

  getWalletData() {
    return this.getLocal('walletPageData')
  }

  setCurrentAccountBook(data) {
    this.saveLocal('currentAccountBook', data)
  }

  getCurrentAccountBook() {
    return this.getLocal('currentAccountBook')
  }

  setStatementCategories(type, data) {
    const cacheAB = this.getCurrentAccountBook()
    if (cacheAB) {
      this.saveLocal(`currentCategories_${type}_${cacheAB.id}`, data)
    } else {
      return null
    }
  }

  getStatementCategories(type) {
    const cacheAB = this.getCurrentAccountBook()
    if (cacheAB) {
      return this.getLocal(`currentCategories_${type}_${cacheAB.id}`)
    } else {
      return null
    }
  }

  setStatementAssets(data) {
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
      return this.getLocal(`currentAssets_${cacheAB.id}`)
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


