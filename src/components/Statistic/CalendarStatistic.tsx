import type { StatementListItem } from '@/api/types'
import Statements from '@/components/Statements'
import jz from '@/jz'
import { Text, View } from '@tarojs/components'
import { format, getDay, getDaysInMonth, startOfMonth } from 'date-fns'
import { memo, useEffect, useState } from 'react'
import { runTask } from '../../utils/async'

interface DayData {
  date: number
  income: number
  expend: number
}

export default memo(function CalendarStatistic({ currentDate }: { currentDate: Date }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<(DayData | null)[]>([])
  const [statements, setStatements] = useState<StatementListItem[]>([])

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  useEffect(() => {
    let active = true
    setSelectedDate((current) =>
      current.getMonth() === currentDate.getMonth() &&
      current.getFullYear() === currentDate.getFullYear()
        ? current
        : startOfMonth(currentDate)
    )
    runTask(
      jz
        .withLoading(jz.api.statistics.getCalendarData(format(currentDate, 'yyyy-MM')))
        .then(({ data }) => {
          if (!active) return
          const days = getDaysInMonth(currentDate)
          const offset = getDay(startOfMonth(currentDate))
          const cells: (DayData | null)[] = Array(Math.ceil((offset + days) / 7) * 7).fill(null)
          for (let day = 1; day <= days; day++)
            cells[offset + day - 1] = data.data.find((item) => item.date === day) ?? {
              date: day,
              income: 0,
              expend: 0
            }
          setCalendarData(cells)
        })
    )
    return () => {
      active = false
    }
  }, [currentDate])

  useEffect(() => {
    let active = true
    const date = format(selectedDate, 'yyyy-MM-dd')
    runTask(
      jz.api.statements.list({ start_date: date, end_date: date }).then(({ data }) => {
        if (active) setStatements(data)
      })
    )
    return () => {
      active = false
    }
  }, [selectedDate])

  const handleDayClick = (day: DayData) => {
    if (day) {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date)
      setSelectedDate(newDate)
    }
  }

  const isToday = (day: DayData) => {
    const today = new Date()
    return (
      day.date === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day: DayData) => {
    return (
      day.date === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    )
  }

  return (
    <View className="calendar-statistic">
      <View className="calendar-grid">
        {weekDays.map((day) => (
          <View key={day} className="week-day">
            {day}
          </View>
        ))}

        {calendarData.map((day, index) => (
          <View
            key={index}
            className={`day-cell ${day && isToday(day) ? 'today' : ''} ${day && isSelected(day) ? 'selected' : ''}`}
            onClick={() => day && handleDayClick(day)}
          >
            {day && (
              <>
                <View className="date-number">{day.date}</View>
                <View className="amount-bars">
                  {day.income > 0 && (
                    <View className="income-bar">
                      <Text className="amount-text fs-12">{day.income}</Text>
                    </View>
                  )}
                  {day.expend > 0 && (
                    <View className="expend-bar">
                      <Text className="amount-text fs-12">{day.expend}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        ))}
      </View>

      <View className="day-summary">
        <View className="summary-header">{format(selectedDate, 'M月d日')} 收支概览</View>
        <View className="summary-content">
          <View className="summary-item">
            <View className="label">支出</View>
            <View className="amount col-expend">
              {statements
                .reduce((sum, item) => sum + (item.type === 'expend' ? Number(item.amount) : 0), 0)
                .toFixed(2)}
            </View>
          </View>
          <View className="summary-item">
            <View className="label">收入</View>
            <View className="amount col-income">
              {statements
                .reduce((sum, item) => sum + (item.type === 'income' ? Number(item.amount) : 0), 0)
                .toFixed(2)}
            </View>
          </View>
          <View className="summary-item">
            <View className="label">结余</View>
            <View className="amount">
              {statements
                .reduce(
                  (sum, item) =>
                    sum +
                    (item.type === 'income'
                      ? Number(item.amount)
                      : item.type === 'expend'
                        ? -Number(item.amount)
                        : 0),
                  0
                )
                .toFixed(2)}
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
