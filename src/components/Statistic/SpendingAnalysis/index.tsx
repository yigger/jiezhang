import type { AnalysisRange } from '@/utils/spending-analysis'
import type { StatementListItem } from '@/api/types'
import EmptyTips from '@/components/EmptyTips'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import {
  analysisPeriod,
  analyzeSpending,
  formatChange,
  formatMoney
} from '@/utils/spending-analysis'
import { View } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { format, parseISO } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import CategoryDetails from './CategoryDetails'
import '@/src/styles'

type DataState =
  | { status: 'loading' }
  | { status: 'error'; key: string; message: string }
  | { status: 'ready'; key: string; current: StatementListItem[]; previous: StatementListItem[] }

export default function SpendingAnalysis({ currentDate }: { currentDate: Date }) {
  const [today, setToday] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [reload, setReload] = useState(0)
  const [data, setData] = useState<DataState>({ status: 'loading' })
  const [showAllChanges, setShowAllChanges] = useState(false)
  const [selected, setSelected] = useState<{ id: number; period: 'current' | 'previous' } | null>(
    null
  )
  const hasShown = useRef(false)
  const period = useMemo(() => analysisPeriod(currentDate, parseISO(today)), [currentDate, today])

  const periodKey = `${period.current.end}:${period.previous.end}`

  useDidShow(() => {
    setToday(format(new Date(), 'yyyy-MM-dd'))
    if (hasShown.current) setReload((value) => value + 1)
    hasShown.current = true
  })

  useEffect(() => {
    const refresh = () => {
      setToday(format(new Date(), 'yyyy-MM-dd'))
      setReload((value) => value + 1)
    }
    jz.event.on('statement:updated', refresh)
    return () => jz.event.off('statement:updated', refresh)
  }, [])

  useEffect(() => {
    let active = true
    setData({ status: 'loading' })
    setSelected(null)
    setShowAllChanges(false)
    if (period.future) {
      setData({ status: 'ready', key: periodKey, current: [], previous: [] })
      return
    }
    const load = async () => {
      const book = await jz.ensureAccountBook()
      if (!active) return
      // The ordinary overview caps results at 1,000; the monthly flow returns the complete book.
      const fetchMonth = async (range: AnalysisRange) => {
        const [year, month] = range.month.split('-')
        const { data } = await jz.api.superStatements.getStatements({
          year: Number(year),
          month: Number(month),
          account_book_id: book.id,
          order_by: 'created_at'
        })
        return data.data
      }
      const [current, previous] = await Promise.all([
        fetchMonth(period.current),
        fetchMonth(period.previous)
      ])
      if (!active || book.id !== jz.storage.getCurrentAccountBook()?.id) return
      setData({ status: 'ready', key: periodKey, current, previous })
    }
    void load().catch((error: unknown) => {
      if (active)
        setData({
          status: 'error',
          key: periodKey,
          message: error instanceof Error ? error.message : '分析加载失败，请重试'
        })
    })
    return () => {
      active = false
    }
  }, [period, periodKey, reload])

  const report = useMemo(
    () =>
      data.status === 'ready' && data.key === periodKey
        ? analyzeSpending(data.current, data.previous, period)
        : null,
    [data, period, periodKey]
  )

  if (period.future) return <EmptyTips content="该月份尚未开始，暂时没有消费分析" />
  if (data.status === 'loading' || !report)
    return data.status === 'error' && data.key === periodKey ? (
      <View className="spending-analysis">
        <EmptyTips content={data.message} />
        <Button title="重新加载" onClick={() => setReload((value) => value + 1)} />
      </View>
    ) : (
      <View className="spending-analysis__empty">正在汇总消费数据…</View>
    )
  const { current, previous, changes, deltaCents, changePercent } = report
  const displayChanges = showAllChanges ? changes : changes.slice(0, 5)
  const remainingChange = changes.slice(5).reduce((sum, row) => sum + row.deltaCents, 0)
  const detail = selected ? changes.find((row) => row.id === selected.id) : null
  const changeClass =
    deltaCents > 0
      ? 'spending-analysis__increase'
      : deltaCents < 0
        ? 'spending-analysis__decrease'
        : ''
  const openCategory = (id: number, target: 'current' | 'previous' = 'current') =>
    setSelected({ id, period: target })

  return (
    <View className="spending-analysis">
      <View className="spending-analysis__scope">当前账簿 · 全部成员 · 仅统计支出账单</View>
      <View className="spending-analysis__card">
        <View className="spending-analysis__heading">
          {period.partial ? '截至今天的支出' : '本月支出'}
        </View>
        <View className="spending-analysis__total">¥{formatMoney(current.totalCents)}</View>
        <View className={`spending-analysis__change ${changeClass}`}>
          {deltaCents === 0
            ? '较上期持平'
            : `较上${period.partial ? '月同期' : '月'}${deltaCents > 0 ? '多' : '少'}支出 ¥${formatMoney(Math.abs(deltaCents))}`}
        </View>
        <View className="spending-analysis__muted">
          {changePercent === null
            ? '上期无支出记录，不计算增长率'
            : `变化幅度 ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`}
        </View>
        <View className="spending-analysis__ranges">
          <View>
            本期：{period.current.start} 至 {period.current.end}
          </View>
          <View>
            上期：{period.previous.start} 至 {period.previous.end}
          </View>
        </View>
        <View className="spending-analysis__metrics">
          <View>
            <View>{current.count} 笔</View>
            <View className="spending-analysis__muted">支出笔数</View>
          </View>
          <View>
            <View>¥{formatMoney(current.averageCents)}</View>
            <View className="spending-analysis__muted">平均单笔</View>
          </View>
          <View>
            <View>{current.activeDays} 天</View>
            <View className="spending-analysis__muted">有支出记录</View>
          </View>
        </View>
      </View>
      {current.count === 0 && previous.count === 0 ? (
        <EmptyTips content="这两个期间没有支出账单，暂时无法分析消费变化" />
      ) : (
        <>
          <View className="spending-analysis__card">
            <View className="spending-analysis__heading">钱花在哪里，变化来自哪里？</View>
            <View className="spending-analysis__muted">
              按变化金额排序，点击分类查看本期与上期账单
            </View>
            {displayChanges.map((row) => (
              <View
                key={row.id}
                className="spending-analysis__category"
                onClick={() => openCategory(row.id, row.current ? 'current' : 'previous')}
              >
                <View className="spending-analysis__heading">
                  <View>{row.name} ›</View>
                  <View
                    className={
                      row.deltaCents > 0
                        ? 'spending-analysis__increase'
                        : row.deltaCents < 0
                          ? 'spending-analysis__decrease'
                          : ''
                    }
                  >
                    {formatChange(row.deltaCents)}
                  </View>
                </View>
                <View className="spending-analysis__muted">
                  上期 ¥{formatMoney(row.previous?.totalCents || 0)} → 本期 ¥
                  {formatMoney(row.current?.totalCents || 0)}
                </View>
                <View className="spending-analysis__reason">{row.explanation}</View>
                <View className="spending-analysis__muted">
                  笔数 {row.previous?.count || 0} → {row.current?.count || 0} · 平均单笔 ¥
                  {formatMoney(row.previous?.averageCents || 0)} → ¥
                  {formatMoney(row.current?.averageCents || 0)}
                </View>
              </View>
            ))}
            {!showAllChanges && changes.length > 5 && (
              <View className="spending-analysis__muted">
                其余分类合计变化：{formatChange(remainingChange)}
              </View>
            )}
            {changes.length > 5 && (
              <Button
                className="primary"
                title={showAllChanges ? '收起分类' : `查看全部 ${changes.length} 个分类`}
                onClick={() => setShowAllChanges(!showAllChanges)}
              />
            )}
            <View className="spending-analysis__footnote">
              归因基于账单笔数和平均单笔金额；平均金额变化也可能来自消费内容变化。
            </View>
          </View>
          <View className="spending-analysis__card">
            <View className="spending-analysis__heading">分类消费画像</View>
            <View className="spending-analysis__muted">
              {period.partial ? '本月截至今天' : '本月整月'} · 点击分类查看明细
            </View>
            {current.categories.length === 0 && (
              <View className="spending-analysis__empty">本期没有支出账单</View>
            )}
            {current.categories.map((row) => (
              <View
                key={row.id}
                className="spending-analysis__category"
                onClick={() => openCategory(row.id)}
              >
                <View className="spending-analysis__heading">
                  <View>{row.name} ›</View>
                  <View>¥{formatMoney(row.totalCents)}</View>
                </View>
                <View className="spending-analysis__bar">
                  <View style={{ width: `${row.share}%` }} />
                </View>
                <View className="spending-analysis__profile">
                  <View>
                    {row.count} 笔 · 均笔 ¥{formatMoney(row.averageCents)}
                  </View>
                  <View>
                    {row.activeDays} 天 · 占比 {row.share.toFixed(1)}%
                  </View>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
      {detail && selected && (
        <CategoryDetails
          key={`${detail.id}:${selected.period}`}
          category={detail}
          period={period}
          initialPeriod={selected.period}
          onClose={() => setSelected(null)}
        />
      )}
    </View>
  )
}
