import type { InsightGroup, InsightReport } from '@/api/logic/insights'
import type { StatementListItem } from '@/api/types'
import jz from '@/jz'
import Statements from '@/components/Statements'
import { Button, Tabs } from '@/src/components/UiComponents'
import { formatMoney } from '@/utils/spending-analysis'
import { ScrollView, View } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import '@/src/styles'
import './index.scss'
import MergeMerchants from './MergeMerchants'

type Section = 'year' | 'merchants' | 'members'
type ReportState = { key: string; report: InsightReport; bookID: number }
type DetailState = { title: string; loading: boolean; rows: StatementListItem[]; error: string }

export default function AnnualInsights({ currentDate }: { currentDate: Date }) {
  const [merging, setMerging] = useState(false)
  const year = currentDate.getFullYear()
  const [section, setSection] = useState<Section>('year')
  const [state, setState] = useState<ReportState | null>(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [detail, setDetail] = useState<DetailState | null>(null)
  const [limit, setLimit] = useState(20)
  const requestID = useRef(0)
  const detailID = useRef(0)
  const shown = useRef(false)
  const key = `${year}:${reload}`
  const future = year > new Date().getFullYear()
  useDidShow(() => {
    if (shown.current) setReload((v) => v + 1)
    shown.current = true
  })
  useEffect(() => {
    const refresh = () => setReload((v) => v + 1)
    jz.event.on('statement:updated', refresh)
    return () => jz.event.off('statement:updated', refresh)
  }, [])
  useEffect(() => {
    const reportRequest = requestID
    const detailRequest = detailID
    const id = ++reportRequest.current
    ++detailRequest.current
    setDetail(null)
    setMerging(false)
    setError('')
    setState(null)
    if (future) return
    void (async () => {
      const book = await jz.ensureAccountBook()
      const response = await jz.api.insights.report(book.id, year)
      if (id === requestID.current && book.id === jz.storage.getCurrentAccountBook()?.id)
        setState({ key, report: response.data, bookID: book.id })
    })().catch((e: unknown) => {
      if (id === requestID.current) setError(e instanceof Error ? e.message : '汇总加载失败')
    })
    return () => {
      ++reportRequest.current
      ++detailRequest.current
    }
  }, [year, key, future])
  const openDetails = async (title: string, ids: number[]) => {
    if (!state) return
    const id = ++detailID.current
    const wanted = new Set(ids)
    setLimit(20)
    setDetail({ title, loading: true, rows: [], error: '' })
    try {
      const months = state.report.months.filter((m) => m.started && m.count > 0)
      const responses = await Promise.all(
        months.map((m) =>
          jz.api.superStatements.getStatements({
            account_book_id: state.bookID,
            year,
            month: m.month,
            order_by: 'created_at'
          })
        )
      )
      const rows = responses
        .flatMap((r) => r.data.data)
        .filter((r) => wanted.has(r.id))
        .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
      if (id === detailID.current && state.bookID === jz.storage.getCurrentAccountBook()?.id)
        setDetail({ title, loading: false, rows, error: '' })
    } catch (e: unknown) {
      if (id === detailID.current)
        setDetail({
          title,
          loading: false,
          rows: [],
          error: e instanceof Error ? e.message : '明细加载失败'
        })
    }
  }
  if (future) return <View className="spending-analysis__empty">该年份尚未开始</View>
  if (!state || state.key !== key)
    return (
      <View className="spending-analysis">
        <View className="spending-analysis__empty">{error || '正在汇总全年账单…'}</View>
        {error && <Button title="重新加载" onClick={() => setReload((v) => v + 1)} />}
      </View>
    )
  const report = state.report
  const maxAmount = Math.max(
    1,
    ...report.months.map((m) => Math.max(m.income_cents, m.expend_cents))
  )
  const highestExpenseMonth = report.months
    .filter((m) => m.started && m.expend_cents > 0)
    .reduce<(typeof report.months)[number] | null>(
      (best, month) => (!best || month.expend_cents > best.expend_cents ? month : best),
      null
    )
  const renderGroup = (g: InsightGroup) => (
    <View
      key={g.key}
      className="spending-analysis__category"
      onClick={() => void openDetails(g.name, g.statement_ids)}
    >
      <View className="spending-analysis__heading">
        <View>{g.name} ›</View>
        <View>¥{formatMoney(g.expend_cents)}</View>
      </View>
      <View className="spending-analysis__muted">
        {g.count} 笔
        {section === 'merchants'
          ? ` · 均笔 ¥${formatMoney(g.average_cents)}`
          : ` · 收入 ¥${formatMoney(g.income_cents)}`}{' '}
        · 最近 {g.last_date}
      </View>
      {g.categories.map((c) => (
        <View key={c.id} className="spending-analysis__muted">
          {c.name} · ¥{formatMoney(c.amount_cents)}
        </View>
      ))}
    </View>
  )
  return (
    <View className="spending-analysis">
      <View className="spending-analysis__scope">
        {year}年 · 当前账簿全部成员 · {report.start_date} 至 {report.end_date}
      </View>
      <Tabs<Section>
        tabs={[
          { id: 'year', title: '年度趋势' },
          { id: 'merchants', title: '商家' },
          { id: 'members', title: '记账成员' }
        ]}
        current={section}
        onChange={setSection}
      />
      {section === 'year' ? (
        <>
          <View className="spending-analysis__card">
            <View className="spending-analysis__heading">年度收支</View>
            <View className="spending-analysis__metrics">
              <View>
                收入<View>¥{formatMoney(report.income_cents)}</View>
              </View>
              <View>
                支出<View>¥{formatMoney(report.expend_cents)}</View>
              </View>
            </View>
            <View className="spending-analysis__total">
              结余 ¥{formatMoney(report.balance_cents)}
            </View>
            <View className="spending-analysis__muted">
              仅收入与支出账单，结余不等同于净资产增长。
            </View>
          </View>
          <View className="spending-analysis__card">
            <View className="spending-analysis__heading">每月趋势</View>
            {highestExpenseMonth && (
              <View className="spending-analysis__muted">
                支出最高：{highestExpenseMonth.month}月 · ¥
                {formatMoney(highestExpenseMonth.expend_cents)}
                {!highestExpenseMonth.complete ? '（截至今天）' : ''}
              </View>
            )}
            <View className="spending-analysis__muted">绿色：收入 · 橙色：支出 · 金额单位：元</View>
            {report.months.map((m) => (
              <View className="annual-insights__month" key={m.month}>
                <View>
                  {m.month}月{!m.started ? ' · 尚未开始' : !m.complete ? ' · 截至今天' : ''}
                </View>
                {m.started && (
                  <>
                    <View className="annual-insights__track">
                      <View
                        className="annual-insights__income"
                        style={{ width: `${(m.income_cents / maxAmount) * 100}%` }}
                      />
                    </View>
                    <View className="annual-insights__track">
                      <View
                        className="annual-insights__expense"
                        style={{ width: `${(m.expend_cents / maxAmount) * 100}%` }}
                      />
                    </View>
                    <View className="spending-analysis__muted">
                      收入 {formatMoney(m.income_cents)} · 支出 {formatMoney(m.expend_cents)} · 结余{' '}
                      {formatMoney(m.balance_cents)}
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
          <View className="spending-analysis__card">
            <View className="spending-analysis__heading">年度大额支出</View>
            {report.large_expenses.length === 0 && (
              <View className="spending-analysis__empty">还没有支出记录</View>
            )}
            {report.large_expenses.map((r) => (
              <View
                key={r.id}
                className="spending-analysis__category"
                onClick={() => void openDetails(r.description || r.category, [r.id])}
              >
                <View className="spending-analysis__heading">
                  <View>{r.description || r.category} ›</View>
                  <View>¥{formatMoney(r.amount_cents)}</View>
                </View>
                <View className="spending-analysis__muted">
                  {r.date} · {r.category}
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View className="spending-analysis__card">
          <View className="spending-analysis__heading">
            {section === 'merchants' ? '商家消费汇总' : '按记账人汇总'}
          </View>
          <View className="spending-analysis__muted">
            {section === 'merchants'
              ? '同名商家自动归并（忽略空格与大小写）。不同名称可以通过合并商家统计设置。'
              : '这里统计谁记录了账单；实际付款人与分摊另行记录。'}
          </View>
          {section === 'merchants' && (
            <Button title="合并商家统计" onClick={() => setMerging(true)} />
          )}
          {(section === 'merchants' ? report.merchants : report.members).map(renderGroup)}
          {(section === 'merchants' ? report.merchants : report.members).length === 0 && (
            <View className="spending-analysis__empty">暂无记录</View>
          )}
        </View>
      )}
      {merging && (
        <MergeMerchants
          bookID={state.bookID}
          groups={report.merchants}
          onClose={() => setMerging(false)}
          onSaved={() => {
            setMerging(false)
            setReload((v) => v + 1)
          }}
        />
      )}
      {detail && (
        <View className="spending-details">
          <View
            className="spending-details__mask"
            onClick={() => {
              ++detailID.current
              setDetail(null)
            }}
          />
          <View className="spending-details__panel">
            <View className="spending-analysis__heading">
              <View>{detail.title} · 明细</View>
              <View
                className="spending-analysis__link"
                onClick={() => {
                  ++detailID.current
                  setDetail(null)
                }}
              >
                关闭
              </View>
            </View>
            <ScrollView scrollY className="spending-details__list">
              {detail.loading ? (
                <View className="spending-analysis__empty">正在加载…</View>
              ) : detail.error ? (
                <View className="spending-analysis__empty">{detail.error}</View>
              ) : (
                <>
                  <Statements statements={detail.rows.slice(0, limit)} />
                  {detail.rows.length > limit && (
                    <Button title="继续查看" onClick={() => setLimit((v) => v + 20)} />
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}
