import type * as ApiTypes from '@/api/types'
import BasePage from '@/components/BasePage'
import Statements from '@/components/Statements'
import jz from '@/jz'
import type { Timeline } from '@/src/types/ui'
import { showModal } from '@/utils/modal'
import { Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { guardEvent, runTask } from '../../utils/async'

export default function AssetsFlow() {
  const [timelines, setTimelines] = useState<Timeline[]>([])
  const [headerData, setHeaderData] = useState<Partial<ApiTypes.WalletInformation>>({})

  const getAssetDetail = async () => {
    const params = jz.router.getParams()
    const asset_id = params.asset_id ?? ''
    const { data } = await jz.api.finances.getAssetDetail(asset_id)
    setHeaderData(data)
  }

  const getAssetTimeLine = async () => {
    const params = jz.router.getParams()
    const asset_id = params.asset_id ?? ''
    const { data } = await jz.api.finances.getAssetTimeline(asset_id)
    setTimelines(data.data)
  }

  useEffect(() => {
    runTask(getAssetDetail())
    runTask(getAssetTimeLine())
  }, [])

  const getAssetStatements = async (index: number, year: number, month: number) => {
    const params = jz.router.getParams()
    const assetId = params.asset_id ?? ''
    const { data } = await jz.api.finances.getAssetStatements({
      asset_id: assetId,
      year: year,
      month: month
    })
    setTimelines((prevTimelines) => {
      const updatedTimelines = prevTimelines.map((timeline, i) => {
        if (i === index) {
          return {
            ...timeline,
            statements: data.data,
            hidden: !timeline.hidden
          }
        } else {
          return {
            ...timeline,
            hidden: true
          }
        }
      })
      return updatedTimelines
    })
  }

  const changeSurplus = async () => {
    const params = jz.router.getParams()
    const asset_id = params.asset_id ?? ''
    const { confirm, content } = await showModal({
      title: '调整资产金额',
      content: headerData['surplus'],
      editable: true,
      placeholderText: '输入金额',
      confirmText: '保存',
      cancelText: '取消'
    })

    if (confirm && content) {
      try {
        const { data } = await jz.api.assets.updateAssetAmount(asset_id, content)
        if (data?.status && data?.status !== 200) {
          jz.toastError(data.msg || '操作失败')
          return
        }
        runTask(getAssetDetail())
      } catch (error) {
        jz.toastError(error instanceof Error ? error.message : '操作失败')
      }
    }
  }

  return (
    <BasePage headerName={headerData['name'] || '资金流水'}>
      <View className="jz-pages-assets-flow">
        <View className="asset-header">
          <View className="balance-section">
            <View className="d-flex flex-center">
              <Text className="label">结余</Text>
              <View className="amount-wrapper">
                <Text className="amount">￥{headerData['surplus']}</Text>
                <Text className="edit-btn" onClick={guardEvent(changeSurplus)}>
                  调整
                </Text>
              </View>
            </View>
            <View className="summary-section">
              <View className="summary-item income">
                <Text className="label">总收入</Text>
                <Text className="value">￥{headerData['income']}</Text>
              </View>
              <View className="summary-item expend">
                <Text className="label">总支出</Text>
                <Text className="value">￥{headerData['expend']}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="timeline-list">
          {timelines.map((timeline, index) => (
            <View className="timeline-item" key={`${timeline.year}-${timeline.month}`}>
              <View
                className={`timeline-header ${!timeline.hidden ? 'active' : ''}`}
                onClick={guardEvent(() => getAssetStatements(index, timeline.year, timeline.month))}
              >
                <View className="date-section">
                  <Text className="month">{timeline.month}月</Text>
                  <Text className="year">{timeline.year}</Text>
                </View>
                <View className="amount-section">
                  <View className="amount-row income">
                    <Text className="label">收入</Text>
                    <Text className="value">￥{timeline.income_amount}</Text>
                  </View>
                  <View className="amount-row expend">
                    <Text className="label">支出</Text>
                    <Text className="value">￥{timeline.expend_amount}</Text>
                  </View>
                </View>
                <View className="balance-section">
                  <Text className="value">￥{timeline.surplus}</Text>
                  <Text className="label">结余</Text>
                  <View
                    className={`iconfont ${timeline.hidden ? 'jcon-arrow-right' : 'jcon-arrow-down'}`}
                  />
                </View>
              </View>
              {!timeline.hidden && (
                <View className="statement-list">
                  <Statements statements={timeline.statements} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </BasePage>
  )
}
