import React, { useState } from 'react'
import BasePage from '@/components/BasePage'
import { View } from '@tarojs/components'
import { useShareAppMessage } from "@tarojs/taro"
import { IndexPage, StatisticPage, FinancePage, ProfilePage } from '@/components/Home'
import config from '../../config'

const tabs = [
  {
    page: 'index',
    name: '首页',
    icon: 'jcon-home1'
  },
  {
    page: 'statistic',
    name: '统计',
    icon: 'jcon-linechart'
  },
  {
    page: 'asset',
    name: '资产',
    icon: 'jcon-creditcard'
  },
  {
    page: 'profile',
    name: '我的', 
    icon: 'jcon-user'
  }
]

export default function Home() {
  const [activeTab, setActiveTab] = useState(tabs[0])

  useShareAppMessage(async () => {
    return {
      title: '我在使用洁账记账，快来一起记账吧',
      path: `/pages/home/index`,
      imageUrl: `${config.host}/logo.png`
    }
  })

  return (
    <BasePage
      withTabBar
      tabs={tabs}
      headerName={activeTab.name}
      activeTab={activeTab}
      switchTab={(tab) => setActiveTab(tab)}
    >
      <View key={activeTab.page}>
        { activeTab.page === 'index' && <IndexPage /> }
        { activeTab.page === 'statistic' && <StatisticPage /> }
        { activeTab.page === 'asset' && <FinancePage /> }
        { activeTab.page === 'profile' && <ProfilePage /> }
      </View>
    </BasePage>
  )
}