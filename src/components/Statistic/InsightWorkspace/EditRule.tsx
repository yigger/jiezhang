import { format } from 'date-fns'
import type { InsightFixedCostInput, InsightProjectInput } from '@/api/logic/insights'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import { Input, Picker, ScrollView, Switch, View } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import AmountField from './AmountField'
import AppearancePicker from '@/components/Project/AppearancePicker'
import { DEFAULT_PROJECT_ICON, DEFAULT_PROJECT_COLOR } from '@/utils/project-appearance'
import OptionPanel from '@/components/SuggestedStatement/OptionPanel'
import type { QuickOption } from '@/components/SuggestedStatement/OptionPanel'
import '@/src/styles'
import { amountCents } from '@/utils/insights'

type Draft =
  { type: 'project'; value: InsightProjectInput } | { type: 'fixed'; value: InsightFixedCostInput }
export default function EditRule({
  bookID,
  draft,
  onClose,
  onSaved,
  members = []
}: {
  members?: { id: number; name: string }[]
  bookID: number
  draft: Draft
  onClose: () => void
  onSaved: () => void
}) {
  const [icon, setIcon] = useState(
    draft.type === 'project' ? draft.value.icon || DEFAULT_PROJECT_ICON : DEFAULT_PROJECT_ICON
  )
  const [color, setColor] = useState(
    draft.type === 'project' ? draft.value.color || DEFAULT_PROJECT_COLOR : DEFAULT_PROJECT_COLOR
  )
  const [participants, setParticipants] = useState(
    draft.type === 'project'
      ? draft.value.participant_ids?.length
        ? draft.value.participant_ids
        : members.map((m) => m.id)
      : []
  )
  const [startDate, setStartDate] = useState(
    draft.type === 'project' ? draft.value.start_date || '' : ''
  )
  const [endDate, setEndDate] = useState(draft.type === 'project' ? draft.value.end_date || '' : '')
  const [name, setName] = useState(draft.value.name)
  const [amount, setAmount] = useState(
    (
      (draft.type === 'project' ? draft.value.budget_cents : draft.value.amount_cents) / 100
    ).toFixed(2)
  )
  const [interval, setInterval] = useState(draft.type === 'fixed' ? draft.value.interval_months : 1)
  const [day, setDay] = useState(draft.type === 'fixed' ? draft.value.due_day : 1)
  const [enabled, setEnabled] = useState(
    draft.type === 'fixed' ? draft.value.active : !draft.value.archived
  )
  const [categoryID, setCategoryID] = useState(draft.type === 'fixed' ? draft.value.category_id : 0)
  const [assetID, setAssetID] = useState(draft.type === 'fixed' ? draft.value.asset_id : 0)
  const [options, setOptions] = useState<{
    categories: QuickOption[]
    assets: QuickOption[]
  } | null>(null)
  const [optionError, setOptionError] = useState('')
  const [retry, setRetry] = useState(0)
  const [selecting, setSelecting] = useState<'category' | 'asset' | null>(null)
  useEffect(() => {
    if (draft.type !== 'fixed') return
    let active = true
    setOptionError('')
    void Promise.all([
      jz.api.statements.categoriesWithForm('expend'),
      jz.api.statements.assetsWithForm()
    ])
      .then(([categories, assets]) => {
        if (!active) return
        if (!categories || !assets || bookID !== jz.storage.getCurrentAccountBook()?.id)
          throw new Error('分类和钱包加载失败')
        const flatten = (data: typeof categories, type?: string) =>
          data.data.flatMap((p) =>
            (p.childs || []).map((c) => ({
              id: c.id,
              name: c.name,
              group: p.name,
              label: `${p.name} / ${c.name}`,
              type,
              frequentRank:
                data.frequent?.findIndex((f) => f.id === c.id) >= 0
                  ? data.frequent.findIndex((f) => f.id === c.id)
                  : undefined
            }))
          )
        setOptions({ categories: flatten(categories, 'expend'), assets: flatten(assets) })
      })
      .catch(() => {
        if (active) setOptionError('分类和钱包加载失败，请重试')
      })
    return () => {
      active = false
    }
  }, [bookID, draft.type, retry])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const busy = useRef(false)
  const save = async () => {
    if (busy.current) return
    const cents = amountCents(amount)
    if (!name.trim() || cents === null || (draft.type === 'fixed' && cents === 0)) {
      setError('请填写名称和有效金额')
      return
    }
    if (
      draft.type === 'project' &&
      ((members.length > 0 && !participants.length) ||
        (startDate && endDate && endDate < startDate))
    ) {
      setError('请选择参与人，结束日期不能早于开始日期')
      return
    }
    if (
      draft.type === 'fixed' &&
      enabled &&
      (!options?.categories.some((c) => c.id === categoryID) ||
        !options?.assets.some((a) => a.id === assetID))
    ) {
      setError('请选择有效的支出分类和钱包')
      return
    }
    if (draft.type === 'project' && !/^#[0-9a-f]{6}$/i.test(color)) {
      setError('颜色请填写六位十六进制色值，例如 #287454')
      return
    }
    busy.current = true
    setSaving(true)
    setError('')
    try {
      if (bookID !== jz.storage.getCurrentAccountBook()?.id)
        throw new Error('账簿已切换，请重新打开')
      if (draft.type === 'project')
        await jz.api.insights.saveProject(bookID, {
          ...draft.value,
          icon,
          color: color.toUpperCase(),
          participant_ids: participants,
          start_date: startDate,
          end_date: endDate,
          name: name.trim(),
          budget_cents: cents,
          archived: !enabled
        })
      else
        await jz.api.insights.saveFixedCost(bookID, {
          ...draft.value,
          name: name.trim(),
          amount_cents: cents,
          category_id: categoryID,
          asset_id: assetID,
          interval_months: interval,
          due_day: day,
          active: enabled
        })
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }
  return (
    <View className="spending-details">
      <View
        className="spending-details__mask"
        onClick={() => {
          if (!saving) onClose()
        }}
      />
      <View className="spending-details__panel">
        <View className="spending-analysis__heading">
          <View>
            {draft.value.id ? '编辑' : '新增'}
            {draft.type === 'project' ? '项目' : '固定开销'}
          </View>
          <View
            className="spending-analysis__link"
            onClick={() => {
              if (!saving) onClose()
            }}
          >
            关闭
          </View>
        </View>
        {selecting && options ? (
          <OptionPanel
            kind={selecting}
            allowIncome={false}
            options={selecting === 'category' ? options.categories : options.assets}
            selectedID={selecting === 'category' ? categoryID : assetID}
            onBack={() => setSelecting(null)}
            onSelect={(item) => {
              if (selecting === 'category') setCategoryID(item.id)
              else setAssetID(item.id)
              setSelecting(null)
            }}
          />
        ) : (
          <ScrollView scrollY className="spending-details__list">
            <View className="insight-workspace__field">
              名称
              <Input
                value={name}
                maxlength={100}
                placeholder="例如旅行、聚会、团建..."
                onInput={(e) => setName(e.detail.value)}
              />
            </View>
            <AmountField
              label={draft.type === 'project' ? '预算（0 表示未设置）' : '每期金额'}
              value={amount}
              onChange={setAmount}
            />
            {draft.type === 'project' && (
              <>
                <AppearancePicker icon={icon} color={color} onIcon={setIcon} onColor={setColor} />
                <View className="insight-workspace__field">
                  参与人
                  {members.map((m) => (
                    <View className="spending-analysis__heading" key={m.id}>
                      <View>{m.name}</View>
                      <Switch
                        checked={participants.includes(m.id)}
                        onChange={(e) =>
                          setParticipants((v) =>
                            e.detail.value ? [...v, m.id] : v.filter((id) => id !== m.id)
                          )
                        }
                      />
                    </View>
                  ))}
                </View>
                <View className="insight-workspace__field">
                  <Picker
                    mode="date"
                    value={startDate || format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setStartDate(e.detail.value)}
                  >
                    <View>开始日期：{startDate || '未设置'} ›</View>
                  </Picker>
                  {startDate && (
                    <View className="spending-analysis__link" onClick={() => setStartDate('')}>
                      清除
                    </View>
                  )}
                </View>
                <View className="insight-workspace__field">
                  <Picker
                    mode="date"
                    value={endDate || startDate || format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setEndDate(e.detail.value)}
                  >
                    <View>结束日期：{endDate || '未设置'} ›</View>
                  </Picker>
                  {endDate && (
                    <View className="spending-analysis__link" onClick={() => setEndDate('')}>
                      清除
                    </View>
                  )}
                </View>
              </>
            )}
            {draft.type === 'fixed' && (
              <>
                <View
                  className="insight-workspace__field"
                  onClick={() => {
                    if (options && !saving) setSelecting('category')
                  }}
                >
                  支出分类：
                  {options?.categories.find((c) => c.id === categoryID)?.label || '请选择'} ›
                </View>
                <View
                  className="insight-workspace__field"
                  onClick={() => {
                    if (options && !saving) setSelecting('asset')
                  }}
                >
                  钱包：{options?.assets.find((a) => a.id === assetID)?.label || '请选择'} ›
                </View>
                {!options && !optionError && (
                  <View className="spending-analysis__muted">正在加载分类和钱包…</View>
                )}
                {optionError && (
                  <View className="insight-workspace__error">
                    {optionError}
                    <Button title="重新加载" onClick={() => setRetry((v) => v + 1)} />
                  </View>
                )}

                <Picker
                  mode="selector"
                  range={Array.from({ length: 12 }, (_, i) => `每 ${i + 1} 个月`)}
                  value={interval - 1}
                  onChange={(e) => setInterval(Number(e.detail.value) + 1)}
                >
                  <View className="insight-workspace__field">周期：每 {interval} 个月 ›</View>
                </Picker>
                <Picker
                  mode="selector"
                  range={Array.from({ length: 31 }, (_, i) => `${i + 1} 日`)}
                  value={day - 1}
                  onChange={(e) => setDay(Number(e.detail.value) + 1)}
                >
                  <View className="insight-workspace__field">自动记账日：{day} 日 ›</View>
                </Picker>
                <View className="spending-analysis__muted">
                  每天 23:55
                  检查到期规则，自动从所选钱包记录支出。同一期只记一次，月份不足指定日期时在月底记账。
                </View>
              </>
            )}
            <View className="insight-workspace__field">
              <View>{draft.type === 'project' ? '项目进行中' : '启用自动记账'}</View>
              <Switch checked={enabled} onChange={(e) => setEnabled(e.detail.value)} />
            </View>
            {error && <View className="insight-workspace__error">{error}</View>}
            <Button title={saving ? '保存中…' : '确定保存'} onClick={() => void save()} />
          </ScrollView>
        )}
      </View>
    </View>
  )
}
