import type { StatementListItem } from '@/api/types'
import EmptyTips from '@/components/EmptyTips'
import Statements from '@/components/Statements'
import jz from '@/jz'
import { Tabs } from '@/src/components/UiComponents'
import { View } from '@tarojs/components'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { runTask } from '../../utils/async'

const tabs = [
  { id: 1, title: '支出' },
  { id: 2, title: '收入' }
]

export default function ExpendList({ currentDate }: { currentDate: Date }) {
  const [currentTab, setCurrentTab] = useState(1)
  const [statements, setStatements] = useState<StatementListItem[]>([])

  useEffect(() => {
    let active = true
    runTask(
      jz.api.statistics
        .getRate(format(currentDate, 'yyyy-MM'), currentTab === 2 ? 'income' : 'expend')
        .then(({ data }) => {
          if (active) setStatements(data)
        })
    )
    return () => {
      active = false
    }
  }, [currentDate, currentTab])

  return (
    <View>
      <Tabs
        tabs={tabs}
        current={currentTab}
        onChange={(tabId: number) => {
          setCurrentTab(tabId)
        }}
      />

      <View>
        {statements.length === 0 && <EmptyTips></EmptyTips>}
        <Statements statements={statements}></Statements>
      </View>
    </View>
  )
}
