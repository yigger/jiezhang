import { useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import jz from '@/jz'
import BasePage from '@/components/BasePage'
import Statements from '@/components/Statements'
import { AtTag } from 'taro-ui'

const CategoryStatement: React.FC = () => {
  const params = jz.router.getParams()
  const [statements, setStatements] = useState([])
  const [orderBy, setOrderBy] = useState('created_at')
  
  const fetchStatements = async (params) => {
    const { data } = await jz.api.superStatements.getStatements({
      ...params,
      order_by: orderBy // Add order_by parameter
    })
    setStatements(data.data)
  }

  useEffect(() => {
    const date = params.date
    const categoryId = params.category_id
    if (date) {
      const [year, month] = date.split('-')
      fetchStatements({ year: year, month: month, category_id: categoryId })
    } else {
      fetchStatements({ category_id: categoryId })
    }
  }, [params, orderBy])

  return (
    <BasePage
      headerName='账单汇总报表'
      forceShowNavigatorBack={true}
    >
      <View className='setting-chart-page' style={{ margin: '0 16px' }}>
        <View className='tab-switch mt-4 mb-4 text-align-right'>
          <AtTag
            name='created_at'
            type='primary'
            active={orderBy === 'created_at'}
            onClick={() => setOrderBy('created_at')}
            customStyle={{
              marginRight: '8px'
            }}
          >
            按日期排序
          </AtTag>
          <AtTag
            name='amount'
            type='primary' 
            active={orderBy === 'amount'}
            onClick={() => setOrderBy('amount')}
          >
            按金额排序
          </AtTag>
        </View>
        <Statements statements={statements}></Statements>
      </View>
    </BasePage>
  )
}

export default CategoryStatement