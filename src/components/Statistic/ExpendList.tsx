import React, { useState, useEffect } from 'react'
import { Tabs } from '@/src/components/UiComponents'
import { View } from '@tarojs/components'
import jz from '@/jz'
import Statements from '@/components/Statements'
import EmptyTips from '@/components/EmptyTips'
import { format } from 'date-fns'

const tabs = [
  { id: 1, title: '支出' },
  { id: 2, title: '收入' }
]

export default function ExpendList({
  currentDate
}) {
  const [currentTab, setCurrentTab] = useState(1)
  const [statements, setStatements] = useState([])

  const getStatements = async (tabId) => {
    setCurrentTab(tabId)
    let type = 'expend'
    if (tabId === 2) {
      type = 'income'
    }
    const { data } = await jz.api.statistics.getRate(format(currentDate, 'yyyy-MM'), type)
    if (data) {
      setStatements(data)
    }
  }

  useEffect(() => {
    getStatements(currentTab)
  }, [currentDate]);
  
  return (
    <View>
      <Tabs tabs={tabs}
        current={currentTab}
        onChange={(tabId) => {
          getStatements(tabId)
        }}
      />

      <View>
        { statements.length === 0 && <EmptyTips></EmptyTips> }
        <Statements statements={statements}></Statements>
      </View>
    </View>
  )
}
