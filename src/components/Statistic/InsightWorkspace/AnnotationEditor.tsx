import type { InsightAnnotationInput, InsightWorkspace } from '@/api/logic/insights'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import { amountCents, equalSplit } from '@/utils/insights'
import { formatMoney } from '@/utils/spending-analysis'
import { Picker, ScrollView, Switch, View } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import AmountField from './AmountField'
import '@/src/styles'

export default function AnnotationEditor({
  statementID,
  amount,
  type,
  canEdit,
  onClose
}: {
  statementID: number
  amount: number
  type: string
  canEdit: boolean
  onClose: () => void
}) {
  const [loaded, setLoaded] = useState<{ bookID: number; workspace: InsightWorkspace } | null>(null)
  const [draft, setDraft] = useState<InsightAnnotationInput>({
    statement_id: statementID,
    project_id: null,
    payer_id: null,
    fixed_cost_id: null,
    allocations: []
  })
  const [split, setSplit] = useState<Record<number, string>>({})
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [saving, setSaving] = useState(false)
  const busy = useRef(false)
  useEffect(() => {
    let active = true
    setError('')
    void (async () => {
      const book = await jz.ensureAccountBook()
      const response = await jz.api.insights.workspace(book.id)
      if (!active || book.id !== jz.storage.getCurrentAccountBook()?.id) return
      const old = response.data.annotations.find((a) => a.statement_id === statementID)
      if (old) {
        setDraft(old)
        setSplitEnabled(old.allocations.length > 0)
        setSplit(
          Object.fromEntries(
            old.allocations.map((a) => [a.member_id, (a.amount_cents / 100).toFixed(2)])
          )
        )
        if (!old.split_valid) setError('账单金额已变化，请重新确认分摊。')
      }
      setLoaded({ bookID: book.id, workspace: response.data })
    })().catch((e: unknown) => {
      if (active) setError(e instanceof Error ? e.message : '设置加载失败')
    })
    return () => {
      active = false
    }
  }, [statementID, reload])
  const editable =
    canEdit || (loaded?.workspace.editable_statement_ids.includes(statementID) ?? false)
  const save = async () => {
    if (!loaded || !editable || busy.current) return
    const allocations: InsightAnnotationInput['allocations'] = []
    if (splitEnabled && type === 'expend') {
      for (const m of loaded.workspace.members) {
        const cents = amountCents(split[m.id] || '0')
        if (cents === null) {
          setError('分摊金额无效')
          return
        }
        if (cents > 0) allocations.push({ member_id: m.id, amount_cents: cents })
      }
      if (allocations.reduce((sum, a) => sum + a.amount_cents, 0) !== Math.round(amount * 100)) {
        setError('分摊合计必须等于账单金额')
        return
      }
    }
    busy.current = true
    setSaving(true)
    setError('')
    try {
      if (loaded.bookID !== jz.storage.getCurrentAccountBook()?.id)
        throw new Error('账簿已切换，请重新打开')
      await jz.api.insights.saveAnnotation(loaded.bookID, { ...draft, allocations })
      jz.event.emit('statement:updated')
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }
  const picker = (
    label: string,
    key: 'project_id' | 'payer_id' | 'fixed_cost_id' | 'consumer_id',
    options: { id: number; name: string }[]
  ) => {
    const all = [{ id: 0, name: '未设置' }, ...options]
    const index = Math.max(
      0,
      all.findIndex((o) => o.id === draft[key])
    )
    return (
      <Picker
        mode="selector"
        range={all.map((o) => o.name)}
        value={index}
        disabled={!editable || saving}
        onChange={(e) =>
          setDraft((v) => ({ ...v, [key]: all[Number(e.detail.value)]?.id || null }))
        }
      >
        <View className="insight-workspace__field">
          {label}：{all[index].name} ›
        </View>
      </Picker>
    )
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
          <View>项目与付款分摊</View>
          <View
            className="spending-analysis__link"
            onClick={() => {
              if (!saving) onClose()
            }}
          >
            关闭
          </View>
        </View>
        <ScrollView scrollY className="spending-details__list">
          {!loaded ? (
            <>
              <View className="spending-analysis__empty">{error || '正在加载…'}</View>
              {error && <Button title="重新加载" onClick={() => setReload((v) => v + 1)} />}
            </>
          ) : (
            <>
              <View className="spending-analysis__muted">
                账单 ¥{formatMoney(Math.round(amount * 100))} · 设置仅用于归集，不改变资产余额。
              </View>
              {picker(
                '项目',
                'project_id',
                loaded.workspace.projects.filter((p) => !p.archived || p.id === draft.project_id)
              )}
              {type === 'expend' && (
                <>
                  {picker('消费人', 'consumer_id', loaded.workspace.members)}
                  {picker('实际付款人', 'payer_id', loaded.workspace.members)}
                  {picker(
                    '固定开销',
                    'fixed_cost_id',
                    loaded.workspace.fixed_costs.filter(
                      (f) => f.active || f.id === draft.fixed_cost_id
                    )
                  )}
                  <View className="insight-workspace__field">
                    记录成员分摊
                    <Switch
                      checked={splitEnabled}
                      disabled={!editable || saving}
                      onChange={(e) => setSplitEnabled(e.detail.value)}
                    />
                  </View>
                  {splitEnabled && (
                    <>
                      <View className="spending-analysis__muted">
                        合计必须等于账单金额，未填写的成员按 0 计算。
                      </View>
                      {editable && (
                        <Button
                          title="全部成员平均分摊"
                          onClick={() =>
                            setSplit(
                              Object.fromEntries(
                                equalSplit(
                                  Math.round(amount * 100),
                                  loaded.workspace.members.map((m) => m.id)
                                ).map((a) => [a.member_id, (a.amount_cents / 100).toFixed(2)])
                              )
                            )
                          }
                        />
                      )}
                      {loaded.workspace.members.map((m) =>
                        editable ? (
                          <AmountField
                            key={m.id}
                            label={m.name}
                            value={split[m.id] || '0.00'}
                            onChange={(v) => setSplit((old) => ({ ...old, [m.id]: v }))}
                          />
                        ) : (
                          <View key={m.id}>
                            {m.name} · ¥{split[m.id] || '0.00'}
                          </View>
                        )
                      )}
                    </>
                  )}
                </>
              )}
              {error && <View className="insight-workspace__error">{error}</View>}
              {editable ? (
                <Button title={saving ? '保存中…' : '确定保存'} onClick={() => void save()} />
              ) : (
                <View className="spending-analysis__muted">
                  只有账单记录人或账簿所有者可以修改。
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  )
}
