import React, { useEffect, useState, useContext } from 'react'
import { View, Text } from '@tarojs/components'
import Statements from '@/components/Statements'
import { HomeStoreContext } from "@/src/stores"
import { observer } from 'mobx-react'
import EmptyTips from '@/components/EmptyTips'
import { format } from 'date-fns'

export default observer(function Summary({
  currentDate
}) {
  const store: HomeStoreContext = useContext(HomeStoreContext)
  useEffect(() => {
    store.getSummaryData(format(currentDate, 'yyyy-MM'))
  }, [currentDate])

  return (
    <View>
      <View className='summary-component__header'>
        <View className='header-item'>
          <View className='col-expend'>{store.summaryData.header['expend']}</View>
          <View className='fs-12'>总支出</View>
        </View>

        <View className='header-item'>
        <View className='col-income'>{store.summaryData.header['income']}</View>
          <View className='fs-12'>总收入</View>
        </View>

        <View className='header-item'>
          <View>{store.summaryData.header['transfer']}</View>
          <View className='fs-12'>转账</View>
        </View>

        <View className='header-item'>
          <View>{store.summaryData.header['repay']}</View>
          <View className='fs-12'>还款</View>
        </View>
      </View>
      <View className='fs-14 bg-color-white p-4'>
        总计（收入-支出-还款）：<Text className="col-expend">{ store.summaryData.header['total'] }</Text>
      </View>

      <View className='m-4'>
        <View>当月账单列表</View>
        <View>
          { store.summaryData.statements.length === 0 && <EmptyTips></EmptyTips> }
          <Statements statements={store.summaryData.statements}></Statements>
        </View>
      </View>
    </View>
  )
})