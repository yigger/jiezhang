import { useEffect, useState } from 'react'
import { View, Picker, ScrollView } from '@tarojs/components'
import jz from '@/jz'
import BasePage from '@/components/BasePage'

import { useRef } from 'react'
import Echarts from 'taro-react-echarts'
import echarts from '@/assets/echarts.js'
import { getExpendLineOption, getPieOption } from '@/utils/echart_option'


const formatDate = (currentDate) => {
  const regex = /(\d{4})[-年](\d{1,2})/;
  const match = currentDate.match(regex);
  
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10)
    };
  }
  
  return null;
}

const echartCommonStyle = {
  'position': 'relative',
  'z-index': 0
}

const ChartIndex: React.FC = () => {
  // 图表引用对象
  const echartPie = useRef(null)
  const echartLine = useRef(null)

  const [pieOption, _] = useState({})

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需加1并补零
  const [currentDate, setCurrentDate] = useState(`${currentYear}-${currentMonth}`); 
  
  const [header, setHeader] = useState({})
  const fetchHeader = async (params) => {
    const {data} = await jz.api.superCharts.getHeader(params)
    setHeader(data.data)
  }

  // 变更日期的回调
  const changeDateCb = (detail) => {
    const dates = detail.value.split('-')
    const dateStr = `${dates[0]}-${dates[1]}`
    setCurrentDate(dateStr)

    const date = formatDate(dateStr)
    fetchHeader(date)
    fetchPieChart(date)
    fetchLineChart(date)
    fetchCategoriesTop(date)
    fetchTableSumary(date)
  }
  
  // 设置饼图
  const fetchPieChart = async (params) => {
    const {data} = await jz.api.superCharts.getPieData(params)
    setTimeout(() => {
      const option = getPieOption(data.data.map((item) => {
        return {
          value: item.data,
          name: item.name
        }
      }))
      echartPie.current?.setOption(option)
    }, 600)
  }

  // 设置柱状图
  const fetchLineChart = async (date) => {
    const {data} = await jz.api.superCharts.getLineData({ year: date.year })
    setTimeout(() => {
      const option = getExpendLineOption(data)
      echartLine.current?.setOption(option)
    }, 600)
  }

  const [topCategories, setTopCategories] = useState([])
  const fetchCategoriesTop = async (date) => {
    const {data} = await jz.api.superCharts.getCategoriesTop({ year: date.year, month: date.month })
    setTopCategories(data.data)
  }

  const [dataSource, setDataSource] = useState([])
  const fetchTableSumary = async (date) => {
    const {data} = await jz.api.superCharts.getTableSumary({ year: date.year, month: date.month })
    setDataSource(data.data)
  }

  useEffect(() => {
    const date = formatDate(currentDate)
    fetchHeader(date)
    fetchPieChart(date)
    fetchLineChart(date)
    fetchCategoriesTop(date)
    fetchTableSumary(date)
  }, [])

  return (
    <BasePage
      headerName='消费报表'
      forceShowNavigatorBack={true}
    >
      <View className='setting-chart-page'>
        <View>
          <Picker
            mode='date'
            fields='month'
            value={currentDate}
            onChange={({detail}) => changeDateCb(detail) }
          >
            <View className='picker p-2 text-align-center fs-16'>
              { currentDate }
            </View>
          </Picker>
        </View>

        <View className='title'>收支总览</View>
        <View className='header p-2 d-flex flex-between mb-4'>
          <View className='column text-align-center'>
            <View className='col-expend fs-14'>￥{header['expend_count']}</View>
            <View>总支出</View>
            {/* <View className={`col-${ header.expend_rise }`}>同期{ header.expend_rise == 'income' ? '增长' : '下降' } { header.expend_percent }%</View> */}
          </View>

          <View className='column text-align-center'>
            <View className='col-income fs-14'>￥{header['income_count']}</View>
            <View>总收入</View>
            {/* <View className={`col-${ header.income_rise }`}>同期{ header.income_rise == 'income' ? '增长' : '下降' } { header.income_percent }%</View> */}
          </View>

          <View className='column text-align-center'>
            <View className='fs-14'>￥{header['surplus']}</View>
            <View>结余</View>
            {/* <View className={`col-${ header.surplus_rise }`}>同期{ header.surplus_rise == 'income' ? '增长' : '下降' } { header.surplus_percent }%</View> */}
          </View>
        </View>

        <View className='title'>消费分类占比</View>
        <View className='pie-echart bg-color-fbfbfb mb-4'>
          <Echarts
            echarts={echarts}
            option={pieOption}
            style={echartCommonStyle}
            onChartReady={(echartsInstance) =>echartPie.current = echartsInstance}
          ></Echarts>
        </View>

        <View className='title'>收入与支出</View>
        <View className='expend-line-echart bg-color-fbfbfb mb-4'>
          <Echarts
            echarts={echarts}
            option={pieOption}
            onChartReady={(echartsInstance) =>echartLine.current = echartsInstance}
          ></Echarts>
        </View>

        <View>
          <View className='title'>消费分类排行</View>
          <View className='top-rate bg-color-fbfbfb'>
            {
              topCategories.map((category, index) => {
                return (
                  <View 
                    className='item mt-2 mb-2 p-4 d-flex flex-between'
                    style={`background-size: ${category.percent}% 100%;`}
                    onClick={() => { jz.router.navigateTo({url: `/pages/setting/chart/category_statement?date=${currentDate}&category_id=${category.category_id}`}) }}
                  >
                    <View>
                      {index+1}. {category.name}
                    </View>
                    <View className='col-expend'>
                      ￥{category.format_amount}
                    </View>
                  </View>
                )
              })
            }
          </View>
        </View>
        
        <View className='title'>当月每日消费</View>

        <ScrollView
          scrollX
          enableFlex
          className='bg-color-white'
        >
          <View className='d-flex p-2'>
            <View style="width:200px">日期</View>
            <View style="width:200px">支出</View>
            <View style="width:200px">收入</View>
            <View style="width:200px">累计支出</View>
            <View style="width:200px">累计结余</View>
          </View>

          <View>
            {
              dataSource.map((item) => {
                return (
                  <View className='d-flex p-2 pt-4 pb-4' style="background: #f9f8f8;border-bottom: 1px solid #ececec">
                    <View style="width:200px">{item.date}</View>
                    <View style="width:200px" className='col-expend'>{item.expend}</View>
                    <View style="width:200px" className='col-income'>{item.income}</View>
                    <View style="width:200px" className='col-expend'>{item.total_expend}</View>
                    <View style="width:200px">{item.total_surplus}</View>
                  </View>
                )
              })
            }
          </View>
        </ScrollView>

      </View>
    </BasePage>
  )
}

export default ChartIndex