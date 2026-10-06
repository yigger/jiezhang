import type { SelectionData } from '@/api/types'
import Calculator from '@/components/Calculator'
import type { CalculatorValue } from '@/components/Calculator'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import { parsePositiveAmount } from '@/utils/validation'
import { Picker, Textarea, View } from '@tarojs/components'
import { format } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import type { StatementSuggestion } from '@/utils/statement-suggestion'

export interface QuickStatement {
  suggestion: StatementSuggestion
  dismissalKey: string
  bookId: number
}
interface CategoryOption {
  id: number
  type: string
  label: string
}
interface AssetOption {
  id: number
  label: string
}
type Options =
  | { status: 'loading' | 'error' }
  | { status: 'ready'; categories: CategoryOption[]; assets: AssetOption[] }

function categories(data: SelectionData, type: string): CategoryOption[] {
  return data.data.flatMap((parent) =>
    (parent.childs || []).map((item) => ({
      id: item.id,
      type,
      label: `${type === 'expend' ? '支出' : '收入'} · ${parent.name} / ${item.name}`
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
    amount: suggestion.amount,
    type: suggestion.source.type,
    categoryId: suggestion.source.category_id,
    assetId: suggestion.source.asset_id,
    description: suggestion.source.description || ''
  }))
  const [options, setOptions] = useState<Options>({ status: 'loading' })
  const [retry, setRetry] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const mounted = useRef(true)
  const [calculator, setCalculator] = useState<CalculatorValue | null>(null)
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
      const [expense, income, assets] = await Promise.all([
        jz.api.statements.categoriesWithForm('expend'),
        jz.api.statements.categoriesWithForm('income'),
        jz.api.statements.assetsWithForm()
      ])
      if (!active) return
      if (bookId !== jz.storage.getCurrentAccountBook()?.id || !expense || !income || !assets)
        throw new Error('选项加载失败')
      setOptions({
        status: 'ready',
        categories: [...categories(expense, 'expend'), ...categories(income, 'income')],
        assets: assets.data.flatMap((parent) =>
          (parent.childs || []).map((item) => ({
            id: item.id,
            label: `${parent.name} / ${item.name}`
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
  }, [bookId, retry])

  const close = () => {
    if (!busy.current) onClose()
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
    busy.current = true
    setSaving(true)
    try {
      const timestamp = new Date()
      await jz.api.statements.create(
        {
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

  return (
    <View className="quick-statement">
      <View
        className="quick-statement__mask"
        onClick={close}
        onTouchMove={(event) => event.stopPropagation()}
      />
      <View className="quick-statement__panel">
        <View className="quick-statement__header">
          <View className="quick-statement__title">{calculator ? '编辑金额' : '记一笔'}</View>
          <View className="quick-statement__close" onClick={close}>
            关闭
          </View>
        </View>
        <View className="quick-statement__subtitle">
          今天 · {calculator ? '完成计算后确认金额' : '已填好上次的记录，确认即可记账'}
        </View>
        <View
          className={`quick-statement__amount ${saving ? '' : 'quick-statement__amount--editable'}`}
          onClick={() => {
            if (saving || calculator) return
            calculationResult.current = draft.amount
            setCalculator({ value: draft.amount, operator: '', prev: '' })
            setError('')
          }}
        >
          <View className="quick-statement__amount-label">金额{!calculator && ' · 点击修改'}</View>
          <View className="quick-statement__amount-value">
            ¥ {calculator ? calculator.value : draft.amount}
          </View>
          {calculator?.operator && (
            <View className="quick-statement__expression">
              {calculator.prev} {calculator.operator} {calculator.value}
            </View>
          )}
        </View>
        {calculator ? (
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
              <Picker
                mode="selector"
                range={categoryOptions}
                rangeKey="label"
                value={Math.max(categoryIndex, 0)}
                disabled={saving || options.status !== 'ready'}
                onChange={({ detail }) => {
                  const item = categoryOptions[Number(detail.value)]
                  if (item)
                    setDraft((current) => ({ ...current, type: item.type, categoryId: item.id }))
                }}
              >
                <View>
                  {selectedCategory?.label ||
                    (options.status === 'loading'
                      ? `${draft.type === 'expend' ? '支出' : '收入'} · ${suggestion.source.category}`
                      : '请选择类型和分类')}{' '}
                  ›
                </View>
              </Picker>
            </View>
            <View className="quick-statement__row">
              <View>资产</View>
              <Picker
                mode="selector"
                range={assetOptions}
                rangeKey="label"
                value={Math.max(assetIndex, 0)}
                disabled={saving || options.status !== 'ready'}
                onChange={({ detail }) => {
                  const item = assetOptions[Number(detail.value)]
                  if (item) setDraft((current) => ({ ...current, assetId: item.id }))
                }}
              >
                <View>
                  {selectedAsset?.label ||
                    (options.status === 'loading'
                      ? suggestion.source.asset
                      : '请选择资产账户')}{' '}
                  ›
                </View>
              </Picker>
            </View>
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
