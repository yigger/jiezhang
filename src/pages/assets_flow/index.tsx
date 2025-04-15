import React, { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import BasePage from '@/components/BasePage'
import jz from '@/jz'
import Statements from '@/components/Statements'
import { useDidShow } from '@tarojs/taro'
// 先引入需要的组件
import { AtFloatLayout, AtInput, AtButton } from 'taro-ui'

export default function AssetsFlow() {
  const [timelines, setTimelines] = useState([])
  const [headerData, setHeaderData] = useState({})
  const [changeAmount, setChangeAmount] = useState(0)
  const [editFlag, setEditFlag] = useState(false)
  const params = jz.router.getParams()
  const [isModalVisible, setIsModalVisible] = useState(false)
  

  useDidShow(() => {
    const asset_id = params.asset_id
    const getAssetDetail = async() => {
      const { data } = await jz.api.finances.getAssetDetail(asset_id)
      setChangeAmount(data['source_surplus'])
      setHeaderData(data)
    }
    const getAssetTimeLine = async() => {
      const { data } = await jz.api.finances.getAssetTimeline(asset_id)
      setTimelines(data.data)
    }
    getAssetDetail()
    getAssetTimeLine()
  })

  const getAssetStatements = async (index: number, year: number, month: number) => {
    const assetId = params.asset_id
    const { data } = await jz.api.finances.getAssetStatements({ asset_id: assetId, year: year, month: month })
    setTimelines(prevTimelines => {
      const updatedTimelines = prevTimelines.map((timeline, i) => {
        if (i === index) {
          return {
            ...timeline,
            statements: data.data,
            hidden: !timeline.hidden
          };
        } else {
          return {
            ...timeline,
            hidden: true
          };
        }
      });
      return updatedTimelines;
    });
  }

  // 修改 doChangeAmount
  const doChangeAmount = async () => {
    const asset_id = params.asset_id
    await jz.api.assets.updateAssetAmount(asset_id, changeAmount)
    setHeaderData(Object.assign(headerData, {source_surplus: changeAmount, surplus: changeAmount}))
    setIsModalVisible(false)
  }

  return (
    <BasePage headerName={headerData['name'] || '资金流水'}>
      <View className='jz-pages-assets-flow'>
        <View className='asset-header'>
          <View className='balance-section'>
            <View className='d-flex flex-center'>
              <Text className='label'>结余</Text>
              <View className='amount-wrapper'>
                <Text className='amount'>￥{headerData['surplus']}</Text>
                <Text 
                  className='edit-btn'
                  onClick={() => setIsModalVisible(true)}
                >
                  调整
                </Text>
              </View>
            </View>
            <View className='summary-section'>
              <View className='summary-item income'>
                <Text className='label'>总收入</Text>
                <Text className='value'>￥{headerData['income']}</Text>
              </View>
              <View className='summary-item expend'>
                <Text className='label'>总支出</Text>
                <Text className='value'>￥{headerData['expend']}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className='timeline-list'>
          {timelines.map((timeline, index) => (
            <View className='timeline-item' key={`${timeline.year}-${timeline.month}`}>
              <View 
                className={`timeline-header ${!timeline.hidden ? 'active' : ''}`}
                onClick={() => getAssetStatements(index, timeline.year, timeline.month)}
              >
                <View className='date-section'>
                  <Text className='month'>{timeline.month}月</Text>
                  <Text className='year'>{timeline.year}</Text>
                </View>
                <View className='amount-section'>
                  <View className='amount-row income'>
                    <Text className='label'>收入</Text>
                    <Text className='value'>￥{timeline.income_amount}</Text>
                  </View>
                  <View className='amount-row expend'>
                    <Text className='label'>支出</Text>
                    <Text className='value'>￥{timeline.expend_amount}</Text>
                  </View>
                </View>
                <View className='balance-section'>
                  <Text className='value'>￥{timeline.surplus}</Text>
                  <Text className='label'>结余</Text>
                  <View className={`iconfont ${timeline.hidden ? 'jcon-arrow-right' : 'jcon-arrow-down'}`} />
                </View>
              </View>
              {!timeline.hidden && (
                <View className='statement-list'>
                  <Statements statements={timeline.statements} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <AtFloatLayout
        isOpened={isModalVisible}
        title='调整余额'
        onClose={() => setIsModalVisible(false)}
      >
        <View className='adjust-balance-modal'>
          <AtInput
            name='value'
            title='余额'
            type='number'
            placeholder='请输入新的余额'
            value={changeAmount}
            onChange={(value) => setChangeAmount(value)}
          />
          <View className='button-group'>
            <AtButton onClick={() => setIsModalVisible(false)}>取消</AtButton>
            <AtButton type='primary' onClick={doChangeAmount}>确定</AtButton>
          </View>
        </View>
      </AtFloatLayout>
    </BasePage>
  )
}