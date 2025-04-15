import {observable, action,computed } from 'mobx';
import { createContext } from "react";
import jz from '@/jz';

// 此 Store 存在的意义在于在切换底部 Tab 的时候，首页的数据不会销毁后重新获取造成闪屏的现象！
class HomeStore {
  @observable indexHeader = {
    month_budget: "0.00",
    month_expend: "0.00",
    today_expend: "0.00",
    use_pencentage: 0,
    message: null,
    trends: {
      day: {ratio: 0, trend: 'up', amount: 0},
      week: {ratio: 0, trend: 'up', amount: 0},
      month: {ratio: 0, trend: 'up', amount: 0}
    }
  }
  @observable statements = []
  
  async fetchStatements(range) {
    const {data} = await jz.withLoading(jz.api.main.statements(range))
    this.statements = data
  }

  @action async fetchHomeData(range = 'today') {
    const [headerSt, statementSt] = await Promise.all([jz.api.main.header(), jz.api.main.statements(range)])
    if (headerSt.isSuccess) {
      this.indexHeader = headerSt.data
    }
    if (statementSt.isSuccess) {
      this.statements = statementSt.data
    }
    this.getProfileData()
  }

  @observable
  financeData = {
    list: [],
    header: {},
    amount_visible: false
  }
  @action async getFinanceData() {
    const cacheData = jz.storage.getWalletData()
    if (cacheData) {
      this.financeData = JSON.parse(cacheData)
    }

    const { data } = await jz.api.finances.index()
    jz.storage.setWalletData(JSON.stringify(data))
    this.financeData = data
  }
  @action async updateFinanceAmountVisible() {
    await jz.api.finances.updateAmountVisible({visible: !this.financeData.amount_visible})
    this.financeData.amount_visible = !this.financeData.amount_visible
    this.getFinanceData()
  }

  @observable summaryData = {
    header: {},
    statements: []
  }
  @action async getSummaryData(date) {
    const [headerSt, statementSt] = await Promise.all([jz.api.statistics.getOverviewHeader(date), jz.api.statistics.getOverviewStatements(date)])
    if (headerSt.isSuccess) {
      this.summaryData['header'] = headerSt.data
    }
    if (statementSt.isSuccess) {
      this.summaryData['statements'] = statementSt.data
    }
  }

  @observable currentAccountBook = jz.storage.getCurrentAccountBook() || {}
  @observable profileData = {
    userInfo: {},
    version: '',
    theme: null,
    account_book: {}
  }
  @action async getProfileData() {
    const cacheAB = jz.storage.getCurrentAccountBook()
    if (cacheAB) {
      this.currentAccountBook = cacheAB
    }

    const { data } = await jz.api.users.getSettingsData()
    this.profileData['userInfo'] = data.user
    this.profileData['version'] = data.version
    this.profileData['theme'] = data.user.theme
    this.currentAccountBook = data.user.account_book
    jz.storage.setCurrentAccountBook(data.user.account_book)
    jz.storage.setCurrentTheme(data.user.theme['class_name'])
  }

  @computed
  get currentTheme() {
    if (this.profileData.theme) {
      return this.profileData.theme['class_name']
    } else {
      const stoTheme = jz.storage.getCurrentTheme()
      return stoTheme ? stoTheme : 'jz-theme-default'
    }
  }
}

export const HomeStoreContext = createContext(new HomeStore());