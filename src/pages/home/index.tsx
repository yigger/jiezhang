import BasePage from '@/components/BasePage'
import { FinancePage, IndexPage, ProfilePage, StatisticPage } from '@/components/Home'
import { View } from '@tarojs/components'
import { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import config from '../../config'
import jz from '@/jz'
import InsightWorkspace from '@/components/Statistic/InsightWorkspace'
import { homeTabs } from '@/utils/home-tabs'
import type { HomeTab } from '@/src/types/ui'

export default function Home() {
  const [tabIDs, setTabIDs] = useState(() => jz.storage.getHomeTabs())
  const [activeTab, setActiveTab] = useState<HomeTab>(homeTabs[0])
  const tabs = tabIDs.flatMap((id) => homeTabs.filter((tab) => tab.page === id))
  useEffect(() => {
    const refresh = () => {
      const ids = jz.storage.getHomeTabs()
      setTabIDs(ids)
      setActiveTab((current) =>
        ids.includes(current.page as (typeof ids)[number]) ? current : homeTabs[0]
      )
    }
    jz.event.on('home-tabs:updated', refresh)
    return () => jz.event.off('home-tabs:updated', refresh)
  }, [])
  useDidShow(() => {
    const ids = jz.storage.getHomeTabs()
    setTabIDs(ids)
    setActiveTab((current) =>
      ids.includes(current.page as (typeof ids)[number]) ? current : homeTabs[0]
    )
  })

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
        {activeTab.page === 'index' && <IndexPage />}
        {activeTab.page === 'statistic' && <StatisticPage />}
        {activeTab.page === 'project' && (
          <InsightWorkspace mode="projects" currentDate={new Date()} />
        )}
        {activeTab.page === 'asset' && <FinancePage />}
        {activeTab.page === 'profile' && <ProfilePage />}
      </View>
    </BasePage>
  )
}
