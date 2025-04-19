import { useState } from 'react'
import { View, Image, Text } from '@tarojs/components'
import jz from '@/jz'
import { useEffect } from 'react'
import BasePage from '@/components/BasePage'
import { AtProgress } from 'taro-ui'
import Taro from '@tarojs/taro'
import { format } from 'date-fns'

export default function BudgetPage () {
  const [childList, setChildList] = useState([])

  const getBudgets = async () => {
    const params = jz.router.getParams()
    console.log(params)
    const { data } = await jz.api.budgets.getCategoryBudget({
      category_id: params.category_id,
      year: format(new Date(params.date), 'yyyy'),
      month: format(new Date(params.date), 'MM')
    })
    setChildList(data.childs)
  }

  useEffect(() => {
    getBudgets()
  }, [])

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
            const {data} = await jz.api.budgets.updateCategoryAmount({category_id: categoryId, amount: newBudget})
            if (data.status !== 200) {
              Taro.showToast({
                title: data.msg,
                icon: 'none'
              })
            }
            getBudgets()
          }
        }
      }
    })
  }

  return (
    <BasePage
      headerName='子分类预算设置'
    >
      <View className='content-box'>
        { childList.map((item) => {
          return (
            <View
              className='budget-item'
            >
              <View className='budget-item-header'>
                <View className='left'>
                  <View className='icon-wrapper'>
                    <Image src={item.icon_path} mode='aspectFill' />
                  </View>
                  <Text className='name'>{item['name']}</Text>
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
    </BasePage>
  )
}