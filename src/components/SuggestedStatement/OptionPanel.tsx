import { Input, ScrollView, View } from '@tarojs/components'
import { useState } from 'react'

export interface QuickOption {
  id: number
  label: string
  name: string
  group: string
  frequentRank?: number
  type?: string
}
export default function OptionPanel({
  kind,
  options,
  selectedID,
  type = 'expend',
  allowIncome = true,
  onSelect,
  onBack
}: {
  kind: 'category' | 'asset'
  options: QuickOption[]
  selectedID: number
  type?: string
  allowIncome?: boolean
  onSelect: (option: QuickOption) => void
  onBack: () => void
}) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState(type)
  const keyword = query.trim().toLocaleLowerCase()
  const visible = options.filter(
    (o) =>
      (kind === 'asset' || o.type === tab) &&
      (!keyword || `${o.group} ${o.name}`.toLocaleLowerCase().includes(keyword))
  )
  const frequent = visible
    .filter((o) => o.frequentRank !== undefined)
    .sort((a, b) => (a.frequentRank ?? 0) - (b.frequentRank ?? 0))
  const groups = [...new Set(visible.map((o) => o.group))]
  const choice = (o: QuickOption) => (
    <View
      key={`${o.type || kind}:${o.id}`}
      className={`quick-options__choice ${selectedID === o.id && (kind === 'asset' || type === o.type) ? 'is-selected' : ''}`}
      onClick={() => onSelect(o)}
    >
      {o.name}
      {selectedID === o.id && (kind === 'asset' || type === o.type) ? ' ✓' : ''}
    </View>
  )
  return (
    <View className="quick-options">
      <View className="quick-options__back" onClick={onBack}>
        ‹ 返回记账
      </View>
      <View className="quick-options__title">选择{kind === 'category' ? '分类' : '资产'}</View>
      {kind === 'category' && allowIncome && (
        <View className="quick-options__tabs">
          {['expend', 'income'].map((t) => (
            <View key={t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
              {t === 'expend' ? '支出' : '收入'}
            </View>
          ))}
        </View>
      )}
      <View className="quick-options__search">
        <Input
          value={query}
          placeholder={kind === 'category' ? '搜索分类或父分类' : '搜索资产或账户类型'}
          onInput={(e) => setQuery(e.detail.value)}
        />
        {query && <View onClick={() => setQuery('')}>清除</View>}
      </View>
      <ScrollView scrollY className="quick-options__list">
        {!!frequent.length && (
          <View>
            <View className="quick-options__heading">
              常用{kind === 'category' ? '分类' : '资产'}
            </View>
            <View className="quick-options__grid">{frequent.map(choice)}</View>
          </View>
        )}
        {groups.map((g) => (
          <View key={g}>
            <View className="quick-options__heading">{g}</View>
            <View className="quick-options__grid">
              {visible.filter((o) => o.group === g).map(choice)}
            </View>
          </View>
        ))}
        {!visible.length && (
          <View className="quick-options__empty">
            没有找到匹配的{kind === 'category' ? '分类' : '资产'}，试试其他关键词
          </View>
        )}
      </ScrollView>
    </View>
  )
}
