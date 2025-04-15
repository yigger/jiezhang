import { useState } from 'react'
import { View, Image, Text } from '@tarojs/components'
import jz from '@/jz'
import { useDidShow } from '@tarojs/taro'
import { useEffect } from 'react'
import BasePage from '@/components/BasePage'
import { AtProgress } from 'taro-ui'

export default function BudgetPage () {
  const [headerData, setHeaderData] = useState({})
  const [parentList, setParentList] = useState([])

  const getHeaderData = async () => {
    const { data } = await jz.api.budgets.getSummary()
    setHeaderData(data)
  }

  const getParentData = async () => {
    const { data } = await jz.api.budgets.getParentList()
    setParentList(data)
  }

  const [shouldFetch, setShouldFetch] = useState(true)
  useEffect(() => {
    if (shouldFetch) {
      getHeaderData()
      getParentData()
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
        <View className='header-banner p-4'>
          <View className='text-align-center' onClick={() => {jz.router.navigateTo({url: `/pages/setting/budget_form/index?id=0&amount=${headerData['source_amount']}`})} }>
            <View>￥{headerData['amount']} <Text className='iconfont jcon-editor'></Text></View>
            <View className='subtitle fs-12'>支出总预算</View>
          </View>

          <View className='d-flex flex-between p-4'>
            <View className='text-align-center flex-1'> <View>{headerData['used']}</View> <View className='fs-12'>当月已用</View> </View>
            <View className='text-align-center flex-1'> <View>{headerData['surplus']}</View> <View className='fs-12'>预算剩余</View> </View>
          </View>
        </View>

        <View className='content-box bg-color-fbfbfb'>
          { parentList.map((item) => {
            return (
              <View className='d-flex p-2 jz-border-bottom-1' onClick={() => jz.router.navigateTo({url: `/pages/setting/child_budget/index?category_id=${item['id']}` }) }>
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