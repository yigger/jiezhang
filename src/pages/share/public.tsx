import React, { useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import { AtTag } from 'taro-ui'
import Statements from '@/components/Statements'
import BasePage from '@/components/BasePage'
import jz from '@/jz'

const PublicPage: React.FC = () => {
  const [orderBy, setOrderBy] = useState<string>('created_at')
  const [dateRange, setDateRange] = useState<{ start_date: string; end_date: string }>({ start_date: '', end_date: '' })
  const [user, setUser] = useState<{ nickname: string, avatar_path: string }>({nickname: '', avatar_path: ''})
  const [statements, setStatements] = useState<Array<any>>([])
  
  useEffect(() => {
    const fetchStatements = async () => {
      const params = jz.router.getParams()
      const { data } = await jz.withLoading(
        jz.api.statements.getListByToken(params.token, orderBy)
      )
      if (data.status === 200) {
        setStatements(data.data.data)
        setDateRange(data.data.date_range)
        setUser(data.data.shared_user)
      } else {
        jz.toastError('分享链接已失效，请联系分享者重新分享', 3000)
      }
    }
    fetchStatements()
  }, [orderBy])

  return (
    <BasePage
      headerName='分享账单'
    >
      <View className='share-page bg-color-white'>
        <View className='p-2'>
          <View>【{user.nickname}】分享的账单列表</View>
          <View>日期范围：{dateRange.start_date} ~ {dateRange.end_date}</View>
        </View>

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

        <View>
          <View className='p-2'>
            共计 {statements.length} 笔账单，
            支出 {statements.filter(s => s.type === 'expend').reduce((acc, cur) => acc + parseFloat(cur.amount), 0).toFixed(2)} 元，
            收入 {statements.filter(s => s.type === 'income').reduce((acc, cur) => acc + parseFloat(cur.amount), 0).toFixed(2)} 元
          </View>
          <Statements statements={statements} editable={false}></Statements>
        </View>
      </View>
    </BasePage>
  )
}

export default PublicPage