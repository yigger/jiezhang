import type { CategoryChange } from '@/utils/spending-analysis'
import { formatMoney } from '@/utils/spending-analysis'
import type { AnalysisPeriod } from '@/utils/spending-analysis'
import Statements from '@/components/Statements'
import { Button, Tabs } from '@/src/components/UiComponents'
import { ScrollView, View } from '@tarojs/components'
import { useState } from 'react'

export default function CategoryDetails({
  category,
  period,
  initialPeriod = 'current',
  onClose
}: {
  category: CategoryChange
  period: AnalysisPeriod
  initialPeriod?: 'current' | 'previous'
  onClose: () => void
}) {
  const [selected, setSelected] = useState(initialPeriod)
  const [limit, setLimit] = useState(20)
  const profile = category[selected]
  const range = period[selected]
  return (
    <View className="spending-details">
      <View className="spending-details__mask" onClick={onClose} />
      <View className="spending-details__panel">
        <View className="spending-analysis__heading">
          <View>{category.name} · 支出明细</View>
          <View className="spending-analysis__link" onClick={onClose}>
            关闭
          </View>
        </View>
        <Tabs<'current' | 'previous'>
          tabs={[
            { id: 'current', title: '本期' },
            { id: 'previous', title: '上期' }
          ]}
          current={selected}
          onChange={(value) => {
            setSelected(value)
            setLimit(20)
          }}
        />
        <View className="spending-analysis__muted">
          {range.start} 至 {range.end}
        </View>
        <View className="spending-details__summary">
          {profile?.count || 0} 笔 · ¥{formatMoney(profile?.totalCents || 0)}
        </View>
        <ScrollView scrollY className="spending-details__list">
          {profile ? (
            <Statements statements={profile.statements.slice(0, limit)} />
          ) : (
            <View className="spending-analysis__empty">该期间没有此类支出账单</View>
          )}
          {profile && profile.count > limit && (
            <Button
              title={`继续查看（剩余 ${profile.count - limit} 笔）`}
              className="primary"
              onClick={() => setLimit((current) => current + 20)}
            />
          )}
        </ScrollView>
      </View>
    </View>
  )
}
