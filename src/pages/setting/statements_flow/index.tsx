import { Component, useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import BasePage from '@/components/BasePage'
import jz from '@/jz'
import AssetBanner from '@/components/AssetBanner'
import Statements from '@/components/Statements'
import './index.scss'

const StatementFlow: React.FC = () => {
  const [firstColumn, setFirstColumn] = useState({})
  const [secColumn, setSecColumn] = useState({})
  const [thirdColumn, setThirdColumn] = useState({})
  const [statementRow, setStatementRow] = useState([])

  const getTimes = async () => {
    const {data} = await jz.api.superStatements.getTime()
    setFirstColumn({
      title: '结余',
      amount: data.data.header.left
    })
    setSecColumn({
      title: '收入',
      amount: data.data.header.income
    })
    setThirdColumn({
      title: '支出',
      amount: data.data.header.expend
    })
    setStatementRow(data.data.statements)
  }

  const getAssetStatements = async (index: number, year: number, month: number) => {
    const { data } = await jz.api.superStatements.getStatements({ year: year, month: month })
    setStatementRow(prevTimelines => {
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

  useEffect(() => {
    getTimes()
  }, [])

  return (
    <BasePage headerName='流水'>
      <View className='jz-pages-assets-flow'>
        <View className='jz-pages-assets-flow__header'>
          <AssetBanner
            firstColumn={firstColumn}
            secColumn={secColumn}
            thirdColumn={thirdColumn}
          />
        </View>

        <View className='jz-pages-assets-flow__list'>
          {statementRow.map((row, index) => (
            <View key={index} className='flow-item'>
              <View 
                className={`flow-item__header ${!row.hidden ? 'active' : ''}`} 
                onClick={() => getAssetStatements(index, row.year, row.month)}
              >
                <View className='time-info'>
                  <Text className='month'>{row.month}月</Text>
                  <Text className='year'>{row.year}年</Text>
                </View>
                <View className='amount-info'>
                  <View className='income-expend'>
                    <Text className='income'>收入：{row.income_amount}</Text>
                    <Text className='expend'>支出：{row.expend_amount}</Text>
                  </View>
                  <View className='surplus'>
                    <Text className='amount'>{row.surplus}</Text>
                    <Text className='label'>结余</Text>
                  </View>
                </View>
                <View className={`arrow iconfont ${row.hidden ? 'jcon-arrow-right' : 'jcon-arrow-down'}`} />
              </View>
              {!row.hidden && (
                <View className='flow-item__content'>
                  <Statements statements={row.statements} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </BasePage>
  )
}

export default StatementFlow