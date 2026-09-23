import jz from '@/jz'
import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import { createContext } from 'react'
import type {
  HomeHeaderResponse,
  HomeSettingsAccountBook,
  HomeSettingsUser,
  OverviewHeaderData,
  StatementListItem,
  Theme,
  WalletResponse
} from '../api/types'
import { runTask } from '../utils/async'
import { isWalletResponse } from '../utils/validation'

const emptyWallet = (): WalletResponse => ({
  list: [],
  header: { total_asset: '0', net_worth: '0', total_liability: '0' },
  receivables: { name: '', amount: '0', childs: [] },
  payables: { name: '', amount: '0', childs: [] },
  amount_visible: false
})

// 此 Store 存在的意义在于在切换底部 Tab 的时候，首页的数据不会销毁后重新获取造成闪屏的现象！
class HomeStore {
  private homeVersion = 0
  private summaryVersion = 0
  private walletVersion = 0
  private profileVersion = 0
  private walletBookId: number | undefined

  constructor() {
    makeObservable(this)
  }

  @observable indexHeader: HomeHeaderResponse = {
    month_budget: '0.00',
    month_expend: '0.00',
    today_expend: '0.00',
    use_pencentage: 0,
    message: null,
    trends: {
      day: { ratio: 0, trend: 'up', amount: '0' },
      week: { ratio: 0, trend: 'up', amount: '0' },
      month: { ratio: 0, trend: 'up', amount: '0' }
    }
  }
  @observable statements: StatementListItem[] = []

  async fetchStatements(range: string) {
    const version = ++this.homeVersion
    const bookId = jz.storage.getCurrentAccountBook()?.id
    const { data } = await jz.withLoading(jz.api.main.statements(range))
    if (version !== this.homeVersion || bookId !== jz.storage.getCurrentAccountBook()?.id) return
    runInAction(() => {
      this.statements = data
    })
  }

  @action async fetchHomeData(range = 'today') {
    const version = ++this.homeVersion
    const bookId = jz.storage.getCurrentAccountBook()?.id
    const [headerSt, statementSt] = await Promise.all([
      jz.api.main.header(),
      jz.api.main.statements(range)
    ])
    if (version !== this.homeVersion || bookId !== jz.storage.getCurrentAccountBook()?.id) return
    runInAction(() => {
      this.indexHeader = headerSt.data
      this.statements = statementSt.data
    })
    runTask(this.getProfileData())
  }

  @observable
  financeData: WalletResponse = emptyWallet()
  @action async getFinanceData() {
    const version = ++this.walletVersion
    const bookId = jz.storage.getCurrentAccountBook()?.id
    if (bookId !== this.walletBookId) {
      this.walletBookId = bookId
      this.financeData = emptyWallet()
    }
    const cacheData = jz.storage.getWalletData()
    if (cacheData) {
      try {
        const cached: unknown = JSON.parse(cacheData)
        if (isWalletResponse(cached)) this.financeData = cached
      } catch {
        /* Discard malformed local cache. */
      }
    }

    const [wallet, profile] = await Promise.all([
      jz.api.finances.index(),
      jz.api.users.getUserInfo()
    ])
    if (version !== this.walletVersion || bookId !== jz.storage.getCurrentAccountBook()?.id) return
    const data = { ...wallet.data, amount_visible: !profile.data.data.hidden_asset_money }
    jz.storage.setWalletData(JSON.stringify(data))
    runInAction(() => {
      this.financeData = data
    })
  }
  @action async updateFinanceAmountVisible() {
    const visible = !this.financeData.amount_visible
    await jz.api.finances.updateAmountVisible({ visible })
    runInAction(() => {
      this.financeData.amount_visible = visible
    })
    jz.storage.setWalletData(JSON.stringify(this.financeData))
  }

  @observable summaryData: { header: OverviewHeaderData; statements: StatementListItem[] } = {
    header: { total: 0, repay: 0, transfer: 0, income: 0, expend: 0 },
    statements: []
  }
  @action async getSummaryData(date: string) {
    const version = ++this.summaryVersion
    const bookId = jz.storage.getCurrentAccountBook()?.id
    const [headerSt, statementSt] = await Promise.all([
      jz.api.statistics.getOverviewHeader(date),
      jz.api.statistics.getOverviewStatements(date)
    ])
    if (version !== this.summaryVersion || bookId !== jz.storage.getCurrentAccountBook()?.id) return
    runInAction(() => {
      this.summaryData = { header: headerSt.data, statements: statementSt.data }
    })
  }

  @observable currentAccountBook: HomeSettingsAccountBook = jz.storage.getCurrentAccountBook() || {
    id: 0,
    name: ''
  }
  @observable profileData: {
    userInfo: Partial<HomeSettingsUser>
    version: string
    theme: HomeSettingsUser['theme'] | null
    account_book: Partial<HomeSettingsAccountBook>
  } = {
    userInfo: {},
    version: '',
    theme: null,
    account_book: {}
  }
  @action async getProfileData() {
    const version = ++this.profileVersion
    const cacheAB = jz.storage.getCurrentAccountBook()
    if (cacheAB) {
      this.currentAccountBook = cacheAB
    }

    const { data } = await jz.api.users.getSettingsData()
    if (version !== this.profileVersion || cacheAB?.id !== jz.storage.getCurrentAccountBook()?.id)
      return
    runInAction(() => {
      this.profileData['userInfo'] = data.user
      this.profileData['version'] = data.version
      this.profileData['theme'] = data.user.theme
      this.currentAccountBook = data.user.account_book
    })
    jz.storage.setCurrentAccountBook(data.user.account_book)
    jz.storage.setCurrentTheme(data.user.theme['class_name'])
  }

  @action async updateTheme(theme: Theme) {
    await jz.api.users.updateUserInfo({ theme_id: theme.id })
    // Ignore settings reads started before this successful theme change.
    ++this.profileVersion
    runInAction(() => {
      this.profileData.theme = theme
      this.profileData.userInfo.theme = theme
      this.profileData.userInfo.theme_id = theme.id
    })
    jz.storage.setCurrentTheme(theme.class_name)
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

export const HomeStoreContext = createContext(new HomeStore())
