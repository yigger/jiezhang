import React, { useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import BasePage from '@/components/BasePage'
import { Tabs } from '@/src/components/UiComponents'
import { format } from 'date-fns'
import BaseForm from '@/components/statementForm/baseForm'

const tabs = [
  { id: 1, title: '支出', type: 'expend' },
  { id: 2, title: '收入', type: 'income' },
  { id: 3, title: '转账', type: 'transfer' },
  { id: 4, title: '还债', type: 'repayment' },
  { id: 5, title: '代付', type: 'payment_proxy' },
  { id: 6, title: '报销', type: 'reimburse' },
  { id: 7, title: '借入', type: 'loan_in' },
  { id: 8, title: '借出', type: 'loan_out' },
]

const StatementForm: React.FC = () => {
  const [typeName, setTypeName] = useState('支出')
  const [currentTab, setCurrentTab] = useState(1)
  const [statement, setStatement] = useState({
    id: 0,
    type: 'expend',
    amount: '',
    category_id: 0,
    asset_id: 0,
    upload_files: [],
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    description: ''
  })

  return (
    <BasePage
      headerName='记一笔'
    >
      <Tabs tabs={tabs}
        current={currentTab}
        onChange={(tabId) => {
          setTypeName(tabs[tabId-1].title)
          setStatement({
            ...statement,
            type: tabs[tabId-1].type
          })
          setCurrentTab(tabId)
        }}
      />
      <View>
        <BaseForm
          typeName={typeName}
          form={statement}
          setForm={setStatement}
          statementType={statement.type}
        />
      </View>
    </BasePage>
  )
}

export default StatementForm