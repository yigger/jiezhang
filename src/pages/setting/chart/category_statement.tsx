import type * as ApiTypes from '@/api/types'
import BasePage from '@/components/BasePage'
import EmptyTips from '@/components/EmptyTips'
import Statements from '@/components/Statements'
import jz from '@/jz'
import { View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { AtTag } from 'taro-ui'
import { runTask } from '../../../utils/async'

const CategoryStatement: React.FC = () => {
  const params = jz.router.getParams()
  const [statements, setStatements] = useState<ApiTypes.StatementListItem[]>([])
  const [orderBy, setOrderBy] = useState('created_at')

  useEffect(() => {
    let active = true
    const [year, month] = (params.date ?? '').split('-')
    runTask(
      jz.api.superStatements
        .getStatements({ year, month, category_id: params.category_id, order_by: orderBy })
        .then(({ data }) => {
          if (active) setStatements(data.data)
        })
    )
    return () => {
      active = false
    }
  }, [params.date, params.category_id, orderBy])

  return (
    <BasePage headerName="账单汇总报表" forceShowNavigatorBack={true}>
      <View className="setting-chart-page" style={{ margin: '0 16px' }}>
        <View className="tab-switch mt-4 mb-4 text-align-right">
          <AtTag
            name="created_at"
            type="primary"
            active={orderBy === 'created_at'}
            onClick={() => setOrderBy('created_at')}
            customStyle={{
              marginRight: '8px'
            }}
          >
            按日期排序
          </AtTag>
          <AtTag
            name="amount"
            type="primary"
            active={orderBy === 'amount'}
            onClick={() => setOrderBy('amount')}
          >
            按金额排序
          </AtTag>
        </View>
        {statements.length === 0 && <EmptyTips></EmptyTips>}
        <Statements statements={statements}></Statements>
      </View>
    </BasePage>
  )
}

export default CategoryStatement
