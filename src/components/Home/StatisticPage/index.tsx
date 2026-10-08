import InsightWorkspace from '@/components/Statistic/InsightWorkspace'
import AnnualInsights from '@/components/Statistic/AnnualInsights'
import CalendarStatistic from '@/components/Statistic/CalendarStatistic'
import ExpendList from '@/components/Statistic/ExpendList'
import SpendingAnalysis from '@/components/Statistic/SpendingAnalysis'
import Summary from '@/components/Statistic/Summary'
import { Tabs } from '@/src/components/UiComponents'
import { Picker, View } from '@tarojs/components'
import { format } from 'date-fns'
import { useMemo, useState } from 'react'

const tabs = [
  { id: 1, title: '日历总览' },
  { id: 2, title: '收支总览' },
  { id: 3, title: '消费分析' },
  { id: 4, title: '消费排行' },
  { id: 5, title: '年度汇总' },
  { id: 6, title: '付款与分摊' }
]

export const StatisticPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentTab, setCurrentTab] = useState(1)

  const handleMonthChange = (e: { detail: { value: string } }) => {
    const [year, month] = e.detail.value.split('-')
    setCurrentDate(new Date(Number(year), month ? Number(month) - 1 : currentDate.getMonth()))
  }

  const handlePrevMonth = () => {
    setCurrentDate(
      currentTab >= 5
        ? new Date(currentDate.getFullYear() - 1, currentDate.getMonth())
        : new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    )
  }

  const handleNextMonth = () => {
    setCurrentDate(
      currentTab >= 5
        ? new Date(currentDate.getFullYear() + 1, currentDate.getMonth())
        : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    )
  }

  const currentComponent = useMemo(() => {
    switch (currentTab) {
      case 1:
        return <CalendarStatistic currentDate={currentDate} />
      case 2:
        return <Summary currentDate={currentDate} />
      case 3:
        return <SpendingAnalysis currentDate={currentDate} />
      case 6:
        return <InsightWorkspace mode="payments" currentDate={currentDate} />
      case 5:
        return <AnnualInsights currentDate={currentDate} />
      case 4:
        return <ExpendList currentDate={currentDate} />
      default:
        return null
    }
  }, [currentTab, currentDate])

  return (
    <View className="jz-pages__statistic">
      <View className="month-selector bg-color-white">
        <View className="month-arrow" onClick={handlePrevMonth}>
          ◀
        </View>
        <Picker
          mode="date"
          fields={currentTab >= 5 ? 'year' : 'month'}
          value={format(currentDate, currentTab >= 5 ? 'yyyy' : 'yyyy-MM')}
          onChange={handleMonthChange}
        >
          <View className="month-text">
            {format(currentDate, currentTab >= 5 ? 'yyyy年' : 'yyyy年MM月')}
          </View>
        </Picker>
        <View className="month-arrow" onClick={handleNextMonth}>
          ▶
        </View>
      </View>

      <Tabs
        tabs={tabs}
        current={currentTab}
        onChange={(tabId) => {
          setCurrentTab(tabId)
        }}
      />

      <View>{currentComponent}</View>
    </View>
  )
}
