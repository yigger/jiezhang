import type { AccountBookListItem, HomeSettingsAccountBook } from '@/api/types'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import { HomeStoreContext, ThemeStoreContext } from '@/src/stores'
import type { HomeTab } from '@/src/types/ui'
import { View } from '@tarojs/components'
import { format } from 'date-fns'
import { observer, Provider } from 'mobx-react'
import React, { useContext, useEffect, useState } from 'react'
import { guardEvent, runTask } from '../../utils/async'
interface BasePageProps {
  children?: React.ReactNode
  headerName: string
  switchTab?: (tab: HomeTab) => void
  tabs?: HomeTab[]
  activeTab?: HomeTab
  contentStyle?: React.CSSProperties | string
  forceShowNavigatorBack?: boolean
  withHeader?: boolean
  withTabBar?: boolean
}

import '@/src/styles'

const RootHeader: React.FC<{
  homeStore: React.ContextType<typeof HomeStoreContext>
  headerName: string
  forceShowNavigatorBack: boolean
  onSidebarToggle: () => void
}> = ({ homeStore, headerName, forceShowNavigatorBack, onSidebarToggle }) => {
  const headerStyle = {
    paddingTop: jz.systemInfo.statusBarHeight,
    height: (jz.systemInfo.statusBarHeight ?? 0) + 46
  }

  return (
    <View
      className="page-root__header-component"
      style={headerStyle}
      onClick={() => {
        headerName === '首页' && onSidebarToggle()
      }}
    >
      {(forceShowNavigatorBack || jz.showNavigatorBack()) && (
        <View
          onClick={() => jz.router.navigateBack()}
          className="iconfont fs-24 mt-2 mb-2 jcon-leftarrow"
        ></View>
      )}
      {headerName === '首页' && (
        <View className="iconfont fs-24 jcon-category mt-2 mb-2 mr-2"></View>
      )}
      {headerName === '分享账单' && (
        <View
          className="iconfont fs-24 jcon-home1 mt-2 mb-2 mr-2"
          onClick={guardEvent(() => jz.router.redirectTo({ url: '/pages/home/index' }))}
        ></View>
      )}
      <View className="header-title fs-18">
        {headerName === '首页' ? homeStore.currentAccountBook?.name || '加载中...' : headerName}
      </View>
    </View>
  )
}

const RootTabBar: React.FC<{
  tabs: HomeTab[]
  activeTab: HomeTab
  switchTab: (tab: HomeTab) => void
}> = ({ switchTab, activeTab, tabs }) => {
  return (
    <View className="page-root__tab-bar-component">
      {tabs.map((header) => {
        return (
          <View
            key={header.page}
            className={`d-flex flex-1 flex-column flex-center ${header.page === activeTab.page ? 'active' : ''}`}
            onClick={() => switchTab(header)}
          >
            <View className={`iconfont fs-21 mt-2 mb-1 ${header.icon}`}></View>
            <View className="fs-12">{header.name}</View>
          </View>
        )
      })}
    </View>
  )
}

const BasePage: React.FC<BasePageProps> = observer(
  ({
    children,
    switchTab,
    headerName,
    tabs,
    activeTab,
    contentStyle,
    forceShowNavigatorBack = false,
    withHeader = true,
    withTabBar = false
  }) => {
    const pageStyle = {
      paddingTop: (jz.systemInfo.statusBarHeight ?? 0) + 46
    }
    const homeStore = useContext(HomeStoreContext)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const onSidebarToggle = () => setSidebarOpen(!sidebarOpen)

    return (
      <Provider home_store={HomeStoreContext} theme_store={ThemeStoreContext}>
        <View className={`page-root ${homeStore.currentTheme}`}>
          <View className="page-root-component" style={pageStyle}>
            {/* 顶部 */}
            {withHeader && (
              <RootHeader
                homeStore={homeStore}
                onSidebarToggle={onSidebarToggle}
                headerName={headerName}
                forceShowNavigatorBack={forceShowNavigatorBack}
              />
            )}
            {/* 主体内容区域 */}
            <View className="page-root__main-content" style={contentStyle}>
              {children}
              <View className="page-root__main-height-gap"></View>
            </View>

            {/* TabBar 部分 */}
            {withTabBar && tabs && activeTab && switchTab && (
              <RootTabBar tabs={tabs} activeTab={activeTab} switchTab={switchTab} />
            )}
          </View>
          {/* Sidebar 部分 */}
          <SlideSidebar
            open={sidebarOpen}
            onSidebarToggle={onSidebarToggle}
            accountBook={homeStore.currentAccountBook}
          ></SlideSidebar>
        </View>
      </Provider>
    )
  }
)

const SlideSidebar = observer(
  ({
    open,
    onSidebarToggle,
    accountBook
  }: {
    open: boolean
    onSidebarToggle: () => void
    accountBook: HomeSettingsAccountBook
  }) => {
    const [accountBooks, setAccountBooks] = useState<AccountBookListItem[]>([])
    const getAccountBooks = async () => {
      const { data } = await jz.withLoading(jz.api.account_books.getAccountBooks())
      setAccountBooks(data)
    }
    const switchAccountBook = async (account_book: AccountBookListItem) => {
      await jz.confirm('切换到新账簿吗？')
      await jz.withLoading(jz.api.account_books.updateDefaultAccount(account_book))
      runTask(jz.router.redirectTo({ url: '/pages/home/index' }))
    }

    useEffect(() => {
      if (open) runTask(getAccountBooks())
    }, [open])

    if (!open) {
      return
    }

    return (
      <View className="slide-sidebar">
        <View className="slide-sidebar__mask" onClick={() => onSidebarToggle()}></View>
        <View className="slide-sidebar__main">
          <View
            className="slide-sidebar__main-content"
            style={`margin-top: ${jz.systemInfo.statusBarHeight}PX`}
          >
            <View className="slide-header fs-18">账簿列表</View>
            <View className="account-list">
              {accountBooks.map((account_book) => {
                return (
                  <View
                    key={account_book.id}
                    className={`account d-flex p-2 m-2 ${account_book.id === accountBook?.id ? 'active' : ''}`}
                    onClick={guardEvent(() => switchAccountBook(account_book))}
                  >
                    <View className="flex-1">
                      {/* 第一行 */}
                      <View className="d-flex mb-1 flex-between">
                        <View>{account_book.name}</View>
                        <View className="">{account_book.account_type_name}</View>
                      </View>
                      {/* 第二行 */}
                      <View className=" fs-14 mb-1" style="min-height: 24PX">
                        {account_book.description}
                      </View>
                      {/* 第三行 */}
                      <View className="d-flex fs-14 mb-1 flex-between">
                        <View>创建者 {account_book.user_id}</View>
                        <View>
                          {format(new Date(String(account_book.created_at)), 'yyyy-MM-dd')}
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
          <View className="mb-4">
            <Button
              title="创建账簿"
              onClick={guardEvent(() =>
                jz.router.navigateTo({ url: '/pages/account_books/create' })
              )}
            ></Button>
          </View>
        </View>
      </View>
    )
  }
)

export default BasePage
