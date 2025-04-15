import React, { useEffect, useState, memo } from 'react'
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import { View, Picker, Text } from '@tarojs/components'
import Statements from '@/components/Statements'
import jz from '@/jz'

interface DayData {
  date: number
  income: number
  expend: number
}

export default memo(function CalendarStatistic({
  currentDate
}) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<(DayData | null)[]>([])
  const [statements, setStatements] = useState<any>([])
  
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  
  useEffect(() => {
    fetchCalendarData()
  }, [currentDate])

  useEffect(() => {
    fetchDayStatements()
  }, [selectedDate])
  
  const fetchCalendarData = async () => {
    const formattedDate = format(currentDate, 'yyyy-MM')
    const { data } = await jz.withLoading(jz.api.statistics.getCalendarData(formattedDate))
    if (data.status === 200) {
      generateCalendarData(data.data)
    }
  }

  const fetchDayStatements = async () => {
    const formattedDate = format(selectedDate, 'yyyy-MM-dd')
    const { data } = await jz.api.statements.list({
      start_date: formattedDate,
      end_date: formattedDate
    })
    if (data) {
      setStatements(data)
    }
  }

  const generateCalendarData = (apiData: any[]) => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = startOfMonth(currentDate)
    const startingDay = getDay(firstDayOfMonth)
    
    // 计算实际需要的行数
    const totalDays = startingDay + daysInMonth
    const totalWeeks = Math.ceil(totalDays / 7)
    const monthData: (DayData | null)[] = Array(totalWeeks * 7).fill(null)
    
    // 填充空白日期
    for (let i = 0; i < startingDay; i++) {
      monthData[i] = null
    }
    
    // 填充日期数据
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = apiData.find(d => d.date === day) || {
        date: day,
        income: 0,
        expend: 0
      }
      monthData[startingDay + day - 1] = dayData
    }
    
    setCalendarData(monthData)
  }

  const handleDayClick = (day: DayData) => {
    if (day) {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date)
      setSelectedDate(newDate)
    }
  }

  const isToday = (day: DayData) => {
    const today = new Date()
    return day.date === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
  }

  const isSelected = (day: DayData) => {
    return day.date === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
  }

  return (
    <View className='calendar-statistic'>
      <View className='calendar-grid'>
        {weekDays.map(day => (
          <View key={day} className='week-day'>{day}</View>
        ))}
        
        {calendarData.map((day, index) => (
          <View 
            key={index} 
            className={`day-cell ${day && isToday(day) ? 'today' : ''} ${day && isSelected(day) ? 'selected' : ''}`}
            onClick={() => day && handleDayClick(day)}
          >
            {day && (
              <>
                <View className='date-number'>{day.date}</View>
                <View className='amount-bars'>
                  {day.income > 0 && (
                    <View className='income-bar'>
                      <Text className='amount-text fs-12'>{day.income}</Text>
                    </View>
                  )}
                  {day.expend > 0 && (
                    <View className='expend-bar'>
                      <Text className='amount-text fs-12'>{day.expend}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        ))}
      </View>

      <View className='day-summary'>
        <View className='summary-header'>
          {format(selectedDate, 'M月d日')} 收支概览
        </View>
        <View className='summary-content'>
          <View className='summary-item'>
            <View className='label'>支出</View>
            <View className='amount col-expend'>
              {statements.reduce((sum, item) => sum + (item.type === 'expend' ? parseFloat(item.amount) : 0), 0).toFixed(2)}
            </View>
          </View>
          <View className='summary-item'>
            <View className='label'>收入</View>
            <View className='amount col-income'>
              {statements.reduce((sum, item) => sum + (item.type === 'income' ? parseFloat(item.amount) : 0), 0).toFixed(2)}
            </View>
          </View>
          <View className='summary-item'>
            <View className='label'>结余</View>
            <View className='amount'>
              {statements.reduce((sum, item) => sum + (item.type === 'income' ? parseFloat(item.amount) : -parseFloat(item.amount)), 0).toFixed(2)}
            </View>
          </View>
        </View>
      </View>

      <View>
        <Statements statements={statements}></Statements>
      </View>
    </View>
  )
})