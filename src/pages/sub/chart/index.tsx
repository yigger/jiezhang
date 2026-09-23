import type * as ApiTypes from '@/api/types'
import BasePage from '@/components/BasePage'
import jz from '@/jz'
import { Picker, ScrollView, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { runTask } from '../../../utils/async'

import echarts from '@/assets/echarts.js'
import { getExpendLineOption, getPieOption } from '@/utils/echart_option'
import Echarts from 'taro-react-echarts'

const formatDate = (currentDate: string) => {
  const regex = /(\d{4})[-年](\d{1,2})/
  const match = currentDate.match(regex)

  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10)
    }
  }

  return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
}

const echartCommonStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 0
}

const ChartIndex: React.FC = () => {
  const now = new Date()
  const [currentDate, setCurrentDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
  const [pieOption, setPieOption] = useState<object>({})
  const [lineOption, setLineOption] = useState<object>({})
  const [header, setHeader] = useState<Partial<ApiTypes.SuperChartHeaderData>>({})
  const [topCategories, setTopCategories] = useState<ApiTypes.SuperCategoryTopItem[]>([])
  const [dataSource, setDataSource] = useState<ApiTypes.SuperTableSummaryItem[]>([])
  const changeDateCb = (detail: { value: string }) => setCurrentDate(detail.value)

  useEffect(() => {
    let active = true
    const date = formatDate(currentDate)
    runTask(
      Promise.all([
        jz.api.superCharts.getHeader(date),
        jz.api.superCharts.getPieData({ ...date, type: 'expend' }),
        jz.api.superCharts.getLineData({ year: date.year }),
        jz.api.superCharts.getCategoriesTop(date),
        jz.api.superCharts.getTableSumary(date)
      ]).then(([headerResult, pie, line, categories, summary]) => {
        if (!active) return
        setHeader(headerResult.data.data)
        setPieOption(
          getPieOption(pie.data.data.map((item) => ({ name: item.name, value: item.data })))
        )
        setLineOption(getExpendLineOption(line.data))
        setTopCategories(categories.data.data)
        setDataSource(summary.data.data)
      })
    )
    return () => {
      active = false
    }
  }, [currentDate])

  return (
    <BasePage headerName="消费报表" forceShowNavigatorBack={true}>
      <View className="setting-chart-page">
        <View>
          <Picker
            mode="date"
            fields="month"
            value={currentDate}
            onChange={({ detail }) => changeDateCb(detail)}
          >
            <View className="picker p-2 text-align-center fs-16">{currentDate}</View>
          </Picker>
        </View>

        <View className="title">收支总览</View>
        <View className="header p-2 d-flex flex-between mb-4">
          <View className="column text-align-center">
            <View className="col-expend fs-14">￥{header['expend_count']}</View>
            <View>总支出</View>
            {/* <View className={`col-${ header.expend_rise }`}>同期{ header.expend_rise == 'income' ? '增长' : '下降' } { header.expend_percent }%</View> */}
          </View>

          <View className="column text-align-center">
            <View className="col-income fs-14">￥{header['income_count']}</View>
            <View>总收入</View>
            {/* <View className={`col-${ header.income_rise }`}>同期{ header.income_rise == 'income' ? '增长' : '下降' } { header.income_percent }%</View> */}
          </View>

          <View className="column text-align-center">
            <View className="fs-14">￥{header['surplus']}</View>
            <View>结余</View>
            {/* <View className={`col-${ header.surplus_rise }`}>同期{ header.surplus_rise == 'income' ? '增长' : '下降' } { header.surplus_percent }%</View> */}
          </View>
        </View>

        <View className="title">消费分类占比</View>
        <View className="pie-echart bg-color-fbfbfb mb-4">
          <Echarts echarts={echarts} option={pieOption} style={echartCommonStyle}></Echarts>
        </View>

        <View className="title">收入与支出</View>
        <View className="expend-line-echart bg-color-fbfbfb mb-4">
          <Echarts echarts={echarts} option={lineOption}></Echarts>
        </View>

        <View>
          <View className="title">消费分类排行</View>
          <View className="top-rate bg-color-fbfbfb">
            {topCategories.map((category, index) => {
              return (
                <View
                  key={category.category_id}
                  className="item mt-2 mb-2 p-4 d-flex flex-between"
                  style={`background-size: ${category.percent}% 100%;`}
                  onClick={() => {
                    runTask(
                      jz.router.navigateTo({
                        url: `/pages/setting/chart/category_statement?date=${currentDate}&category_id=${category.category_id}`
                      })
                    )
                  }}
                >
                  <View>
                    {index + 1}. {category.name}
                  </View>
                  <View className="col-expend">￥{category.format_amount}</View>
                </View>
              )
            })}
          </View>
        </View>

        <View className="title">当月每日消费</View>

        <ScrollView scrollX enableFlex className="bg-color-white">
          <View className="d-flex p-2">
            <View style="width:200px">日期</View>
            <View style="width:200px">支出</View>
            <View style="width:200px">收入</View>
            <View style="width:200px">累计支出</View>
            <View style="width:200px">累计结余</View>
          </View>

          <View>
            {dataSource.map((item) => {
              return (
                <View
                  key={item.date}
                  className="d-flex p-2 pt-4 pb-4"
                  style="background: #f9f8f8;border-bottom: 1px solid #ececec"
                >
                  <View style="width:200px">{item.date}</View>
                  <View style="width:200px" className="col-expend">
                    {item.expend}
                  </View>
                  <View style="width:200px" className="col-income">
                    {item.income}
                  </View>
                  <View style="width:200px" className="col-expend">
                    {item.total_expend}
                  </View>
                  <View style="width:200px">{item.total_surplus}</View>
                </View>
              )
            })}
          </View>
        </ScrollView>
      </View>
    </BasePage>
  )
}

export default ChartIndex
