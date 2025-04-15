import Taro from '@tarojs/taro'
import React, { useContext, useEffect, useState } from 'react'
import jz from '@/jz'
import { View } from '@tarojs/components'
import { observer, Provider } from 'mobx-react'
import { ThemeStoreContext, HomeStoreContext } from "@/src/stores"
import { Button } from '@/src/components/UiComponents'
import { format } from 'date-fns'

import 'taro-ui/dist/style/index.scss'
import '../../assets/fonts/index.styl'
import '../../assets/styl/index.styl'

const RootHeader: React.FC = ({
  homeStore,
  headerName,
  forceShowNavigatorBack,
  onSidebarToggle
}) => {
  const headerStyle = {
    paddingTop: jz.systemInfo.statusBarHeight,
    height: jz.systemInfo.statusBarHeight + 46
  }

  return (
    <View className='page-root__header-component' style={headerStyle} onClick={() => { headerName === '首页' && onSidebarToggle() }}>
      { (forceShowNavigatorBack || jz.showNavigatorBack())
         && <View onClick={() => jz.router.navigateBack()} className='iconfont fs-24 mt-2 mb-2 jcon-leftarrow'></View> }
      { headerName === '首页' && <View className='iconfont fs-24 jcon-category mt-2 mb-2 mr-2'></View>}
      { headerName === '分享账单' && <View className='iconfont fs-24 jcon-home1 mt-2 mb-2 mr-2' onClick={() => jz.router.redirectTo({url: '/pages/home/index'})}></View>}
      <View className='header-title fs-18'>
        { headerName === '首页' ? (homeStore.currentAccountBook?.name || '加载中...') : headerName }
      </View>
    </View>
  )
}

const RootTabBar: React.FC = ({
  switchTab,
  activeTab,
  tabs
}) => {


  return (
    <View className='page-root__tab-bar-component'>
      {
        tabs.map((header) => {
          return (
            <View
              className={`d-flex flex-1 flex-column flex-center ${header.page === activeTab.page ? 'active' : ''}`}
              onClick={() => switchTab(header)}
            >
              <View className={`iconfont fs-21 mt-2 mb-1 ${header.icon}`}></View>
              <View className='fs-12'>{header.name}</View>
            </View>
          )
        })
      }
    </View>
  )
}

const BasePage: React.FC = observer(
  ({
  children,
  switchTab,
  headerName,
  tabs,
  activeTab,
  contentStyle,
  forceShowNavigatorBack=false,
  withHeader = true,
  withTabBar = false,
}) => {
  const pageStyle = {
    paddingTop: jz.systemInfo.statusBarHeight + 46
  }
  const homeStore: HomeStoreContext = useContext(HomeStoreContext)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const onSidebarToggle = () => setSidebarOpen(!sidebarOpen)

  return (
    <Provider
      home_store={HomeStoreContext}
      theme_store={ThemeStoreContext}
    >
      <View
        className='page-root'
        dataThemeName={homeStore.currentTheme}
      >
        <View className='page-root-component' style={pageStyle}>
          {/* 顶部 */}
          { withHeader && 
            <RootHeader
              homeStore={homeStore}
              onSidebarToggle={onSidebarToggle}
              headerName={headerName}
              forceShowNavigatorBack={forceShowNavigatorBack} />
          }
          {/* 主体内容区域 */}
          <View className='page-root__main-content' style={contentStyle}>
            {children}
            <View className='page-root__main-height-gap'></View>
          </View>
          
          {/* TabBar 部分 */}
          { withTabBar &&
            <RootTabBar
              tabs={tabs}
              activeTab={activeTab}
              switchTab={switchTab}
              />
          }
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
})

const SlideSidebar = observer(({
  open,
  onSidebarToggle,
  accountBook
}) => {
  const [accountBooks, setAccountBooks] = useState([])
  const getAccountBooks = async () => {
    Taro.showLoading()
    const { data } = await jz.api.account_books.getAccountBooks()
    Taro.hideLoading()
    setAccountBooks(data)
  }
  const switchAccountBook = async (account_book) => {
    await jz.confirm('切换到新账簿吗？')
    Taro.showLoading('切换中')
    await jz.api.account_books.updateDefaultAccount(account_book)
    Taro.hideLoading()
    jz.router.redirectTo({ url: '/pages/home/index' })
  }

  useEffect(() => {
    if (open) getAccountBooks()
  }, [open])

  if (!open) {
    return
  }

  return (
    <View className="slide-sidebar">
      <View className='slide-sidebar__mask' onClick={() => onSidebarToggle()}></View>
      <View className='slide-sidebar__main'>
        <View className='slide-sidebar__main-content' style={`margin-top: ${jz.systemInfo.statusBarHeight}PX`}>
          <View className='slide-header fs-18'>账簿列表</View>
          <View className='account-list'>
            {
              accountBooks.map((account_book) => {
                return (
                  <View 
                    className={`account d-flex p-2 m-2 ${account_book.id === accountBook?.id ? 'active' : ''}`}
                    onClick={() => switchAccountBook(account_book)}
                  >
                    <View className='flex-1'>
                      {/* 第一行 */}
                      <View className='d-flex mb-1 flex-between'>
                        <View>{ account_book.name }</View>
                        <View className=''>{ account_book.account_type_name }</View>
                      </View>
                      {/* 第二行 */}
                      <View className=' fs-14 mb-1' style="min-height: 24PX">{ account_book.description }</View>
                      {/* 第三行 */}
                      <View className='d-flex fs-14 mb-1 flex-between'>
                        <View>创建者 { account_book.user?.nickname }</View>
                        <View>{ format(new Date(account_book.created_at), 'yyyy-MM-dd') }</View>
                      </View>
                    </View>
                  </View>
                )
              })
            }
            
          </View>
        </View>
        <View className='mb-4'>
          <Button title='创建账簿' onClick={() =>  jz.router.navigateTo({ url: '/pages/account_books/create' }) }></Button>
        </View>
      </View>
    </View>
  )
})

export default BasePage