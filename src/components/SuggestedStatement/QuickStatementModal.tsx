import type { SelectionData } from '@/api/types'
import Calculator from '@/components/Calculator'
import type { CalculatorValue } from '@/components/Calculator'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import { parsePositiveAmount } from '@/utils/validation'
import { Picker, Textarea, View } from '@tarojs/components'
import { format } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import '@/src/styles'
import OptionPanel from './OptionPanel'
import type { QuickOption } from './OptionPanel'
import type { StatementSuggestion } from '@/utils/statement-suggestion'

export interface QuickStatement {
  expenseOnly?: boolean
  suggestion?: StatementSuggestion
  project?: { id: number; name: string; members: { id: number; name: string }[] }
  dismissalKey: string
  bookId: number
}
type CategoryOption = QuickOption & { type: string }
type AssetOption = QuickOption
type Options =
  | { status: 'loading' | 'error' }
  | { status: 'ready'; categories: CategoryOption[]; assets: AssetOption[] }

function categories(data: SelectionData, type: string): CategoryOption[] {
  return data.data.flatMap((parent) =>
    (parent.childs || []).map((item) => ({
      id: item.id,
      type,
      label: `${type === 'expend' ? '支出' : '收入'} · ${parent.name} / ${item.name}`,
      name: item.name,
      group: parent.name,
      frequentRank:
        data.frequent?.findIndex((f) => f.id === item.id) >= 0
          ? data.frequent.findIndex((f) => f.id === item.id)
          : undefined
    }))
  )
}

export default function QuickStatementModal({
  statement,
  onClose,
  onSaved
}: {
  statement: QuickStatement
  onClose: () => void
  onSaved: () => void
}) {
  const { suggestion, bookId } = statement
  const [draft, setDraft] = useState(() => ({
    amount: suggestion?.amount || '0',
    type: statement.expenseOnly ? 'expend' : suggestion?.source.type || 'expend',
    categoryId: suggestion?.source.category_id || 0,
    assetId: suggestion?.source.asset_id || 0,
    description: suggestion?.source.description || ''
  }))
  const [consumerID, setConsumerID] = useState(
    statement.project?.members.find((m) => m.id === jz.storage.getCurrentUser()?.id)?.id ||
      statement.project?.members[0]?.id ||
      0
  )
  const [options, setOptions] = useState<Options>({ status: 'loading' })
  const [selecting, setSelecting] = useState<'category' | 'asset' | null>(null)
  const [retry, setRetry] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const initialDraft = useRef(draft)
  const initialConsumerID = useRef(consumerID)
  const busy = useRef(false)
  const mounted = useRef(true)
  const [calculator, setCalculator] = useState<CalculatorValue | null>(
    statement.expenseOnly ? { value: '', operator: '', prev: '' } : null
  )
  const calculationResult = useRef(draft.amount)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setOptions({ status: 'loading' })
    const load = async () => {
      const [expense, income, assets, frequentExpense, frequentIncome, frequentAssets] =
        await Promise.all([
          jz.api.statements.categoriesWithForm('expend'),
          statement.expenseOnly
            ? Promise.resolve({ data: [], frequent: [] })
            : jz.api.statements.categoriesWithForm('income'),
          jz.api.statements.assetsWithForm(),
          jz.api.statements
            .categoryFrequent('expend')
            .then((r) => r.data)
            .catch(() => null),
          statement.expenseOnly
            ? Promise.resolve([])
            : jz.api.statements
                .categoryFrequent('income')
                .then((r) => r.data)
                .catch(() => null),
          jz.api.statements
            .assetFrequent()
            .then((r) => r.data)
            .catch(() => null)
        ])
      if (!active) return
      if (bookId !== jz.storage.getCurrentAccountBook()?.id || !expense || !income || !assets)
        throw new Error('选项加载失败')
      const assetRanks = frequentAssets ?? assets.frequent
      setOptions({
        status: 'ready',
        categories: [
          ...categories({ ...expense, frequent: frequentExpense ?? expense.frequent }, 'expend'),
          ...categories({ ...income, frequent: frequentIncome ?? income.frequent }, 'income')
        ],
        assets: assets.data.flatMap((parent) =>
          (parent.childs || []).map((item) => ({
            id: item.id,
            label: `${parent.name} / ${item.name}`,
            name: item.name,
            group: parent.name,
            frequentRank:
              assetRanks?.findIndex((f) => f.id === item.id) >= 0
                ? assetRanks.findIndex((f) => f.id === item.id)
                : undefined
          }))
        )
      })
    }
    void load().catch(() => {
      if (active) setOptions({ status: 'error' })
    })
    return () => {
      active = false
    }
  }, [bookId, retry, statement.expenseOnly])

  const hasChanges =
    consumerID !== initialConsumerID.current ||
    JSON.stringify(draft) !== JSON.stringify(initialDraft.current) ||
    Boolean(calculator?.value || calculator?.operator || calculator?.prev)
  const close = () => {
    if (busy.current) return
    if (selecting) {
      setSelecting(null)
      return
    }
    if (hasChanges) setConfirmDiscard(true)
    else onClose()
  }
  const dismissMask = () => {
    if (busy.current || confirmDiscard || hasChanges) return
    close()
  }
  const save = async () => {
    if (busy.current || calculator || options.status !== 'ready') return
    setError('')
    const amount = parsePositiveAmount(draft.amount)
    if (amount === null) {
      setError('请输入大于零且最多两位小数的金额')
      return
    }
    if (
      !options.categories.some((item) => item.id === draft.categoryId && item.type === draft.type)
    ) {
      setError('请选择记账类型和分类')
      return
    }
    if (!options.assets.some((item) => item.id === draft.assetId)) {
      setError('请选择资产账户')
      return
    }
    if (bookId !== jz.storage.getCurrentAccountBook()?.id) {
      setError('账簿已切换，请关闭后重新确认')
      return
    }
    if (statement.project && !statement.project.members.some((m) => m.id === consumerID)) {
      setError('请选择消费人')
      return
    }
    busy.current = true
    setSaving(true)
    try {
      const timestamp = new Date()
      await jz.api.statements.create(
        {
          ...(statement.project
            ? { project_id: statement.project.id, consumer_id: consumerID }
            : {}),
          type: draft.type,
          amount,
          category_id: draft.categoryId,
          asset_id: draft.assetId,
          description: draft.description.trim(),
          date: format(timestamp, 'yyyy-MM-dd'),
          time: format(timestamp, 'HH:mm:ss'),
          payee_id: 0,
          mood: '',
          target_object: '',
          from_asset_id: 0,
          to_asset_id: 0,
          location: '',
          nation: '',
          province: '',
          city: '',
          district: '',
          street: ''
        },
        bookId
      )
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : '保存失败，请稍后重试')
      return
    } finally {
      busy.current = false
      if (mounted.current) setSaving(false)
    }
    // The write succeeded; closing and feedback must not offer a second submission.
    if (mounted.current) onSaved()
  }

  const categoryOptions = options.status === 'ready' ? options.categories : []
  const assetOptions = options.status === 'ready' ? options.assets : []
  const categoryIndex = categoryOptions.findIndex(
    (item) => item.id === draft.categoryId && item.type === draft.type
  )
  const assetIndex = assetOptions.findIndex((item) => item.id === draft.assetId)
  const selectedCategory = categoryOptions[categoryIndex]
  const selectedAsset = assetOptions[assetIndex]
  const frequent = <T extends QuickOption>(items: T[]) =>
    items
      .filter((item) => item.frequentRank !== undefined)
      .sort((a, b) => (a.frequentRank ?? 0) - (b.frequentRank ?? 0))
      .slice(0, 3)
  const frequentCategories = frequent(categoryOptions.filter((item) => item.type === draft.type))
  const frequentAssets = frequent(assetOptions)

  return (
    <View className="quick-statement">
      <View
        className="quick-statement__mask"
        onClick={dismissMask}
        onTouchMove={(event) => event.stopPropagation()}
      />
      <View className={`quick-statement__panel quick-statement__panel--bottom`}>
        {confirmDiscard && (
          <View className="quick-statement__discard" onClick={(e) => e.stopPropagation()}>
            <View className="quick-statement__title">放弃这笔记录？</View>
            <View className="quick-statement__subtitle">已输入的金额和选择将不会保存</View>
            <View className="quick-statement__actions">
              <Button
                title="继续记账"
                className="primary"
                onClick={() => setConfirmDiscard(false)}
              />
              <Button title="放弃记录" danger onClick={onClose} />
            </View>
          </View>
        )}
        <View className="quick-statement__header">
          <View className="quick-statement__title">
            {selecting
              ? '选择记账信息'
              : calculator
                ? '编辑金额'
                : statement.expenseOnly
                  ? '快记支出'
                  : '记一笔'}
          </View>
          <View className="quick-statement__close" onClick={close}>
            {selecting ? '返回' : '关闭'}
          </View>
        </View>
        {!selecting && (
          <>
            <View className="quick-statement__subtitle">
              今天 ·{' '}
              {calculator
                ? '完成计算后确认金额'
                : statement.project
                  ? `计入 ${statement.project.name}`
                  : statement.expenseOnly
                    ? '填写金额，选择分类和资产即可'
                    : '已填好上次的记录，确认即可记账'}
            </View>
            {statement.project && (
              <Picker
                mode="selector"
                range={statement.project.members.map((m) => m.name)}
                value={Math.max(
                  0,
                  statement.project.members.findIndex((m) => m.id === consumerID)
                )}
                onChange={(e) =>
                  setConsumerID(statement.project?.members[Number(e.detail.value)]?.id || 0)
                }
              >
                <View className="quick-statement__subtitle">
                  消费人：
                  {statement.project.members.find((m) => m.id === consumerID)?.name || '请选择'} ›
                </View>
              </Picker>
            )}
            <View
              className={`quick-statement__amount ${saving ? '' : 'quick-statement__amount--editable'}`}
              onClick={() => {
                if (saving || calculator) return
                calculationResult.current = draft.amount
                setCalculator({ value: draft.amount, operator: '', prev: '' })
                setError('')
              }}
            >
              <View className="quick-statement__amount-label">
                金额{!calculator && ' · 点击修改'}
              </View>
              <View className="quick-statement__amount-value">
                ¥ {calculator ? calculator.value : draft.amount}
              </View>
              {calculator?.operator && (
                <View className="quick-statement__expression">
                  {calculator.prev} {calculator.operator} {calculator.value}
                </View>
              )}
            </View>
          </>
        )}
        {selecting ? (
          <OptionPanel
            kind={selecting}
            options={selecting === 'category' ? categoryOptions : assetOptions}
            selectedID={selecting === 'category' ? draft.categoryId : draft.assetId}
            type={draft.type}
            allowIncome={!statement.expenseOnly}
            onBack={() => setSelecting(null)}
            onSelect={(item) => {
              setDraft((current) =>
                selecting === 'category'
                  ? { ...current, type: item.type || current.type, categoryId: item.id }
                  : { ...current, assetId: item.id }
              )
              setSelecting(null)
            }}
          />
        ) : calculator ? (
          <View>
            <Calculator
              value={draft.amount}
              embedded
              replaceOnInput
              confirmText="完成"
              onChange={(next) => {
                setCalculator(next)
                if (!next.operator) calculationResult.current = next.value
              }}
              onClose={() => {
                setDraft((current) => ({ ...current, amount: calculationResult.current }))
                setCalculator(null)
              }}
            />
            <Button title="取消修改" className="primary" onClick={() => setCalculator(null)} />
          </View>
        ) : (
          <>
            <View className="quick-statement__row">
              <View>类型</View>
              <View
                className="quick-statement__select"
                onClick={() => {
                  if (!saving && options.status === 'ready') setSelecting('category')
                }}
              >
                {selectedCategory?.label ||
                  (options.status === 'loading' ? '正在加载分类…' : '选择分类')}{' '}
                ›
              </View>
            </View>
            {frequentCategories.length > 0 && (
              <View className="quick-statement__frequent">
                <View>常用分类</View>
                {frequentCategories.map((item) => (
                  <View
                    key={item.id}
                    className={`quick-statement__chip ${draft.categoryId === item.id ? 'is-selected' : ''}`}
                    onClick={() => {
                      if (!busy.current)
                        setDraft((current) => ({ ...current, categoryId: item.id }))
                    }}
                  >
                    {item.name}
                    {draft.categoryId === item.id ? ' ✓' : ''}
                  </View>
                ))}
              </View>
            )}
            <View className="quick-statement__row">
              <View>资产</View>
              <View
                className="quick-statement__select"
                onClick={() => {
                  if (!saving && options.status === 'ready') setSelecting('asset')
                }}
              >
                {selectedAsset?.label ||
                  (options.status === 'loading' ? '正在加载资产…' : '选择资产账户')}{' '}
                ›
              </View>
            </View>
            {frequentAssets.length > 0 && (
              <View className="quick-statement__frequent">
                <View>常用资产</View>
                {frequentAssets.map((item) => (
                  <View
                    key={item.id}
                    className={`quick-statement__chip ${draft.assetId === item.id ? 'is-selected' : ''}`}
                    onClick={() => {
                      if (!busy.current) setDraft((current) => ({ ...current, assetId: item.id }))
                    }}
                  >
                    {item.name}
                    {draft.assetId === item.id ? ' ✓' : ''}
                  </View>
                ))}
              </View>
            )}
            <View className="quick-statement__notes">
              <View>备注</View>
              <Textarea
                value={draft.description}
                disabled={saving}
                maxlength={200}
                placeholder="可不填"
                onFocus={() => setCalculator(null)}
                onInput={({ detail }) =>
                  setDraft((current) => ({ ...current, description: detail.value }))
                }
              />
            </View>
            {options.status === 'loading' && (
              <View className="quick-statement__subtitle">正在加载类型和资产…</View>
            )}
            {options.status === 'error' && (
              <View className="quick-statement__error">
                类型和资产加载失败
                <Button
                  title="重新加载"
                  className="primary"
                  onClick={() => setRetry((value) => value + 1)}
                />
              </View>
            )}
            {error && <View className="quick-statement__error">{error}</View>}
            <View className="quick-statement__actions">
              <Button title="取消" className="primary" disabled={saving} onClick={close} />
              <Button
                title={saving ? '保存中…' : '确定'}
                disabled={saving || options.status !== 'ready'}
                onClick={save}
              />
            </View>
          </>
        )}
      </View>
    </View>
  )
}
