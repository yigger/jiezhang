import { useState } from 'react'
import { View, Image, Text } from '@tarojs/components'
import jz from '@/jz'
import { useEffect } from 'react'
import { useDidShow } from '@tarojs/taro'
import BasePage from '@/components/BasePage'
import { AtProgress } from 'taro-ui'

export default function BudgetPage () {
  const [parentBudget, setParentBudget] = useState({})
  const [childList, setChildList] = useState([])

  const getBudgets = async () => {
    const { data } = await jz.api.budgets.getCtegoryBudget({ category_id: jz.router.getParams().category_id })
    setParentBudget(data.root)
    setChildList(data.childs)
  }

  const [shouldFetch, setShouldFetch] = useState(true)
  useEffect(() => {
    if (shouldFetch) {
      getBudgets()
      setShouldFetch(false)
    }
  }, [shouldFetch])

  useDidShow(() => {
    setShouldFetch(true);
  })

  return (
    <BasePage
      headerName='预算管理'
    >
      <View className='jz-pages__budget'>
        <View className='child_budget-root'>
          <View className='d-flex p-2 jz-border-bottom-1' onClick={() => {jz.router.navigateTo({url: `/pages/setting/budget_form/index?category_id=${parentBudget['id']}&amount=${parentBudget['source_amount']}`})} }>
            {/* 左侧 */}
            <View className='statement-component__icon-image'>
              <Image src={parentBudget.icon_path}></Image>
            </View>
            {/* 右侧 */}
            <View className='flex-1 ml-2'>
              <View className='d-flex flex-between '>
                <View>{parentBudget['name']}</View>
                <View>可用余额 {parentBudget['surplus']}<Text className='iconfont jcon-editor'></Text></View>
              </View>
              <View className='mt-1 mb-1'><AtProgress percent={parentBudget.use_percent} isHidePercent={true}/></View>
              <View className=' fs-14'>支出预算 {parentBudget['amount']}</View>
            </View>
          </View>
        </View>

        <View className='content-box bg-color-fbfbfb'>
          <View className='pt-4 pb-4'>二级消费的预算</View>
          { childList.map((item) => {
            return (
              <View className='d-flex p-2 jz-border-bottom-1' onClick={() => {jz.router.navigateTo({url: `/pages/setting/budget_form/index?category_id=${item['id']}&amount=${item['source_amount']}`})} }>
                {/* 左侧 */}
                <View className='statement-component__icon-image'>
                  <Image src={item.icon_path}></Image>
                </View>
                {/* 右侧 */}
                <View className='flex-1 ml-2'>
                  <View className='d-flex flex-between col-text-mute'>
                    <View>{item['name']}</View>
                    <View>可用余额 {item['surplus']} <Text className='iconfont jcon-editor'></Text></View>
                  </View>
                  <View className='mt-1 mb-1'><AtProgress percent={item.use_percent} isHidePercent={true}/></View>
                  <View className='col-text-mute fs-14'>支出预算 {item['amount']}</View>
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