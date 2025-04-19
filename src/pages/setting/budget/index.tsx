import { useState } from 'react'
import { View, Image, Text, Picker } from '@tarojs/components'
import jz from '@/jz'
import BasePage from '@/components/BasePage'
import { AtProgress } from 'taro-ui'
import { format, getDaysInMonth, differenceInDays, endOfMonth, startOfMonth } from 'date-fns'
import Taro, { useDidShow } from '@tarojs/taro'

export default function BudgetPage () {
  const [headerData, setHeaderData] = useState({})
  const [parentList, setParentList] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // 计算预算相关数据
  const calculateBudgetMetrics = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const today = new Date()
    const monthEnd = endOfMonth(currentDate)
    const daysLeft = differenceInDays(monthEnd, today)
    const dailyBudget = headerData.source_amount / daysInMonth
    const dailySpent = headerData.used / (daysInMonth - daysLeft)
    const dailyRemaining = (headerData.surplus || 0) / (daysLeft || 1)

    return {
      daysInMonth,
      daysLeft,
      dailyBudget: dailyBudget.toFixed(2),
      dailySpent: dailySpent.toFixed(2),
      dailyRemaining: dailyRemaining.toFixed(2),
      monthStart: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
      monthEnd: format(monthEnd, 'yyyy-MM-dd')
    }
  }

  const getHeaderData = async (date) => {
    const { data } = await jz.api.budgets.getSummary({
      year: format(date, 'yyyy'),
      month: format(date, 'MM')
    })
    setHeaderData(data)
  }

  const getParentData = async (date) => {
    const { data } = await jz.api.budgets.getParentList({
      year: format(date, 'yyyy'),
      month: format(date, 'MM')
    })
    setParentList(data)
  }

  useDidShow(() => {
    getHeaderData(currentDate)
    getParentData(currentDate)
  })


  const handleDateChange = (e) => {
    const [year, month] = e.detail.value.split('-')
    const date = new Date(year, month - 1)
    setCurrentDate(date)
    getHeaderData(date)
  }

  const handleAccountBookBudget = (categoryId, amount) => {
    Taro.showModal({
      title: '修改预算',
      content: amount.toString().replace(/\.0$/, '') || amount.toFixed(2), // 处理金额显示，如果小数位是.00则只保留整数部分，否则保留两位小数
      inputType: 'number',
      editable: true,
      success: async (res) => {
        if (res.confirm) {
          const newBudget = parseFloat(res.content)
          if (!isNaN(newBudget) && newBudget >= 0) {
            if (categoryId === 0) {
              const {data} = await jz.api.budgets.updateRootAmount({amount: newBudget})
              if (data.status !== 200) {
                Taro.showToast({
                  title: data.msg,
                  icon: 'none'
                })
              }
            } else {
              const {data} = await jz.api.budgets.updateCategoryAmount({category_id: categoryId, amount: newBudget})
              if (data.status !== 200) {
                Taro.showToast({
                  title: data.msg,
                  icon: 'none'
                })
              }
              getParentData(currentDate)
            }
            getHeaderData(currentDate)
          }
        }
      }
    })
  }

  return (
    <BasePage headerName='预算管理'>
      <View className='jz-pages__budget'>
        <View className='header-banner'>
          <View className='date-picker'>
            <Picker
              mode='date'
              fields='month'
              value={format(currentDate, 'yyyy-MM')}
              onChange={handleDateChange}
            >
              <View className='picker-text'>
                {format(currentDate, 'yyyy年MM月')}
                <Text className='iconfont jcon-arrow-down ml-1'></Text>
              </View>
            </Picker>
          </View>

          <View className='budget-period'>
            <Text>{calculateBudgetMetrics().monthStart}</Text>
            <Text className='mx-2'>至</Text>
            <Text>{calculateBudgetMetrics().monthEnd}</Text>
            <Text className='days-left'>距离月底还剩 {calculateBudgetMetrics().daysLeft} 天</Text>
          </View>

          <View className='budget-amount'>
            <View className='progress-ring'>
              <View className='inner-content'>
                <View className='fs-14'>总预算</View>
                <Text className='amount'>￥{headerData['amount'] || 0}</Text>
                <Text className='iconfont jcon-editor ml-2' onClick={() => {
                  handleAccountBookBudget(0, headerData['source_amount'])
                }}></Text>
              </View>
              
              <View
                className='progress' 
                style={{ 
                  background: `conic-gradient(var(--primary-color) ${(headerData.used / headerData.source_amount) * 100}%, transparent 0)`
                }} 
              />
            </View>
          </View>

          <View className='budget-metrics p-4'>
            <View className='metric-item'>
              <Text className='label col-expend'>当月消费</Text>
              <Text className='value col-expend'>￥{headerData.used}</Text>
            </View>

            <View className='metric-item'>
              <Text className='label'>剩余可用预算</Text>
              <Text className='value'>￥{headerData.source_amount - headerData.used}</Text>
            </View>

            <View className='metric-item'>
              <Text className='label col-text-warn'>剩余每日可用</Text>
              <Text className='value col-text-warn'>￥{calculateBudgetMetrics().dailyRemaining}</Text>
            </View>
          </View>

          <View className='budget-metrics p-4'>
            <View className='metric-item'>
              <Text className='label'>当月日均消费</Text>
              <Text className='value'>￥{calculateBudgetMetrics().dailySpent}</Text>
            </View>
            <View className='metric-item'>
              <Text className='label'>日均预算</Text>
              <Text className='value'>￥{calculateBudgetMetrics().dailyBudget}</Text>
            </View>
            
          </View>
        </View>

        <View className='content-box'>
          { parentList.map((item) => {
            return (
              <View className='budget-item'>
                <View className='budget-item-header'>
                  <View className='left'>
                    <View className='icon-wrapper'>
                      <Image src={item.icon_path} mode='aspectFill' />
                    </View>
                    <Text className='name'>{item['name']}</Text>
                  </View>
                  <View className='right'>
                    <Text
                      className='col-text-link fs-14'
                      onClick={() => jz.router.navigateTo({url: `/pages/setting/child_budget/index?category_id=${item['id']}&date=${format(currentDate, 'yyyy-MM-dd')}` })}
                    >设置子分类预算</Text>
                  </View>
                </View>

                <View className='budget-item-content'>
                  <View className='progress-bar'>
                    <AtProgress percent={item.use_percent} isHidePercent color='var(--primary-color)' />
                    <View className='d-flex flex-between fs-14'>
                      <View>已用:￥{item.used_amount}</View>
                      <View>{item.use_percent}%</View>
                    </View>
                  </View>
                  
                  <View className='budget-info'>
                    <View className='info-item'>
                      <Text className='label'>预算金额</Text>
                      <Text className='value'>￥{item['amount']}</Text>
                      <Text className='iconfont jcon-editor col-text-link' />
                      <Text
                        className='col-text-link fs-14'
                        onClick={(e) => {
                          handleAccountBookBudget(item['id'], item['source_amount'])
                        }}
                      >调整预算</Text>
                    </View>
                    <View className='info-item'>
                      <Text className='label'>剩余可用</Text>
                      <Text className='value col-text-warn'>￥{item['surplus']}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )
            }) 
          }
        </View>
      </View>
    </BasePage>
  )
}