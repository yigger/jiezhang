import BasePage from '@/components/BasePage'
import BaseForm from '@/components/statementForm/baseForm'
import { Tabs } from '@/src/components/UiComponents'
import type { StatementFormData } from '@/src/types/ui'
import { View } from '@tarojs/components'
import { format } from 'date-fns'
import React, { useState } from 'react'

const tabs = [
  { id: 1, title: '支出', type: 'expend' },
  { id: 2, title: '收入', type: 'income' },
  { id: 3, title: '转账', type: 'transfer' },
  { id: 4, title: '还债', type: 'repayment' },
  { id: 5, title: '代付', type: 'payment_proxy' },
  { id: 6, title: '报销', type: 'reimburse' },
  { id: 7, title: '借入', type: 'loan_in' },
  { id: 8, title: '借出', type: 'loan_out' }
]

const StatementForm: React.FC = () => {
  const [showMore, setShowMore] = useState(false)
  const [typeName, setTypeName] = useState('支出')
  const [currentTab, setCurrentTab] = useState(1)
  const [statement, setStatement] = useState<StatementFormData>({
    id: 0,
    type: 'expend',
    amount: '',
    category_id: 0,
    asset_id: 0,
    upload_files: [],
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    description: '',
    mood: '',
    from_asset_id: 0,
    to_asset_id: 0,
    payee_id: 0,
    target_object: '',
    location: '',
    nation: '',
    province: '',
    city: '',
    district: '',
    street: ''
  })

  return (
    <BasePage headerName="记一笔">
      <Tabs
        tabs={[
          ...tabs.slice(0, 3),
          { id: 9, title: currentTab > 3 ? `更多 · ${typeName}` : '更多' }
        ]}
        current={showMore || currentTab > 3 ? 9 : currentTab}
        onChange={(tabId) => {
          if (tabId === 9) {
            setShowMore(!showMore)
            return
          }
          setShowMore(false)
          setTypeName(tabs[tabId - 1].title)
          setStatement({
            ...statement,
            type: tabs[tabId - 1].type
          })
          setCurrentTab(tabId)
        }}
      />
      {showMore && (
        <View className="m-3 p-3 bg-color-white">
          {tabs.slice(3).map((tab, index) => (
            <View
              key={tab.id}
              className="p-3"
              onClick={() => {
                setCurrentTab(tab.id)
                setTypeName(tab.title)
                setStatement({ ...statement, type: tab.type })
                setShowMore(false)
              }}
            >
              <View>{tab.title}</View>
              <View className="fs-12 col-text-mute">
                {
                  [
                    '从一个账户还款到另一个账户',
                    '替别人付款，之后需要收回',
                    '记录需要向公司或项目方报销的款项',
                    '向别人借钱，之后需要归还',
                    '借钱给别人，之后需要收回'
                  ][index]
                }
              </View>
            </View>
          ))}
        </View>
      )}
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
