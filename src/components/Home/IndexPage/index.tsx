import React, { useEffect, useState, useContext } from 'react'
import { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import Statements from '@/components/Statements'
import { Button } from '@/src/components/UiComponents'
import { AtProgress } from 'taro-ui'
import { HomeStoreContext } from "@/src/stores"
import { observer } from 'mobx-react'
import EmptyTips from '@/components/EmptyTips'
import jz from '@/jz'
import Taro from '@tarojs/taro';
import { showModal } from '@tarojs/taro';

export const IndexPage = observer(() => {
  const store: HomeStoreContext = useContext(HomeStoreContext)
  const [shouldFetch, setShouldFetch] = useState<boolean>(true)
  const [activeRange, setActiveRange] = useState('today')
  const ranges = [
    { key: 'today', name: '今日' },
    { key: 'yesterday', name: '昨日' },
    { key: 'week', name: '本周' },
    { key: 'month', name: '本月' }
  ]
  useEffect(() => {
    if (shouldFetch) {
      store.fetchHomeData()
      setShouldFetch(false)
    }
  }, [shouldFetch])

  useEffect(() => {
    if (store.indexHeader.message) {
      Taro.showModal({
        title: store.indexHeader.message.title,
        content: store.indexHeader.message.sub_title,
        confirmText: '查看详情',
        success: function (res) {
          if (res.confirm) {
            jz.router.navigateTo({ 
              url: `/pages/setting/messages/detail?messageId=${store.indexHeader.message.id}` 
            })
          }
        }
      })
    }
  }, [store.indexHeader])

  useDidShow(() => {
    setShouldFetch(true);
  })

  return (
    <View className='jz-pages__index'>
      <Header header={store.indexHeader}></Header>
      <Button
        title='记一笔'
        onClick={() => {
          jz.router.navigateTo({ url: '/pages/statement/form' })
        }}
      />
      
      <View className='m-3'>
        <View className='d-flex flex-between flex-center mb-2'>
          <View className='header-with-color-bottom'>账单列表</View>
          <View className='d-flex time-range-tabs'>
            {ranges.map(range => (
              <View 
                key={range.key}
                className={`tab-item fs-12 ${activeRange === range.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveRange(range.key)
                  
                  store.fetchStatements(range.key)
                }}
              >
                {range.name}
              </View>
            ))}
          </View>
        </View>
        { store.statements.length === 0 && <EmptyTips></EmptyTips> }
        <Statements statements={store.statements}></Statements>
      </View>
    </View>
  )
})

const Header = ({ header }) => {
  return (
    <View className="jz-pages__index-header p-relative">
      <View className='row-item d-flex flex-between m-4'>
        <View className='row-content-block'>
          <View className='block-content'>
            <View className='p-2'>
              <Text className='currency'>￥</Text>
              <Text className='amount-item'>{header['today_expend']}</Text>
            </View>
            <View className='fs-12 col-text-mute'>今日支出</View>
          </View>
        </View>

        <View className='row-content-block'>
          <View className='block-content'>
            <View className='p-2'>
              <Text className='currency'>￥</Text>
              <Text className='amount-item'>{header['month_expend']}</Text>
            </View>
            <View className='fs-12 col-text-mute'>本月支出</View>
          </View>
        </View>
      </View>

      {header.trends && (
        <View className='trend-block m-4'>
          <View className='fs-14 col-text-mute'>消费趋势</View>
          <View className='d-flex flex-between mt-2'>
            <View className='trend-item'>
              <View className='fs-12'>较昨日</View>
              <View className={`fs-16 ${header.trends.day.trend === 'down' ? 'col-expend' : 'col-income'}`}>
                <View>{header.trends.day.amount}</View>
                <View className='fs-12'>{header.trends.day.ratio}%{header.trends.day.trend === 'up' ? '↑' : '↓'}</View> 
              </View>
            </View>

            <View className='trend-item'>
              <View className='fs-12'>较上周</View>
              <View className={`fs-16 ${header.trends.week.trend === 'down' ? 'col-expend' : 'col-income'}`}>
                <View>{header.trends.week.amount}</View>
                <View className='fs-12'>{header.trends.week.ratio}%{header.trends.week.trend === 'up' ? '↑' : '↓'}</View> 
              </View>
            </View>

            <View className='trend-item'>
              <View className='fs-12'>较上月</View>
              <View className={`fs-16 ${header.trends.month.trend === 'down' ? 'col-expend' : 'col-income'}`}>
                <View>{header.trends.month.amount}</View>
                <View className='fs-12'>{header.trends.month.ratio}%{header.trends.month.trend === 'up' ? '↑' : '↓'}</View> 
              </View>
            </View>
          </View>
        </View>
      )}

      <View className='budget-item m-4' onClick={() => jz.router.navigateTo({ url: `/pages/setting/budget/index` }) }>
        <View className='fs-14 col-text-mute'>预算使用情况</View>
        <View className='mt-1 mb-1'><AtProgress percent={header['use_pencentage']}/></View>
        <View className='d-flex col-text-mute flex-between'>
          <View>已用：{header['month_expend']}</View>
          <View>总额：{header['month_budget']}</View>
        </View>
      </View>
    </View>
    
  )
}