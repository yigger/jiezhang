import { Component, useState, useMemo } from 'react'
import { View, Picker } from '@tarojs/components'
import { Tabs } from '@/src/components/UiComponents'
import Summary from '@/components/Statistic/Summary'
import ExpendList from '@/components/Statistic/ExpendList'
import CalendarStatistic from '@/components/Statistic/CalendarStatistic'
import { format } from 'date-fns'

const tabs = [
  { id: 1, title: '日历总览' },
  { id: 2, title: '收支总览' },
  // { id: 3, title: '消费趋势' },
  { id: 4, title: '消费排行' }
]

export const StatisticPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentTab, setCurrentTab] = useState(1)
  
  const handleMonthChange = (e) => {
    const [year, month] = e.detail.value.split('-')
    setCurrentDate(new Date(Number(year), Number(month) - 1))
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const currentComponent = useMemo(() => {
    switch(currentTab) {
      case 1:
        return <CalendarStatistic currentDate={currentDate} />
      case 2:
        return <Summary currentDate={currentDate} />
      case 4:
        return <ExpendList currentDate={currentDate} />
      default:
        return null
    }
  }, [currentTab, currentDate])

  return (
    <View className='jz-pages__statistic'>
      <View className='month-selector bg-color-white'>
        <View className='month-arrow' onClick={handlePrevMonth}>◀</View>
        <Picker
          mode='date'
          fields='month'
          value={format(currentDate, 'yyyy-MM')}
          onChange={handleMonthChange}
        >
          <View className='month-text'>
            {format(currentDate, 'yyyy年MM月')}
          </View>
        </Picker>
        <View className='month-arrow' onClick={handleNextMonth}>▶</View>
      </View>

      <Tabs tabs={tabs}
        current={currentTab}
        onChange={(tabId) => {
          setCurrentTab(tabId) 
        }}
      />

      <View>
        {currentComponent}
      </View>
    </View>
  )
}