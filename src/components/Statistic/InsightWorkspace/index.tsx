import type {
  InsightFixedCostInput,
  InsightGroup,
  InsightProjectInput,
  InsightReport,
  InsightWorkspace as Workspace
} from '@/api/logic/insights'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import { formatMoney } from '@/utils/spending-analysis'
import { View } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import ProjectCard from '@/components/Project/ProjectCard'
import { runTask } from '@/utils/async'
import EditRule from './EditRule'
import SnapshotDialog from './SnapshotDialog'
import GroupDetails from './GroupDetails'
import '@/src/styles'

type Section = 'projects' | 'fixed' | 'payments' | 'portfolio'
type Draft =
  { type: 'project'; value: InsightProjectInput } | { type: 'fixed'; value: InsightFixedCostInput }
export default function InsightWorkspace({
  currentDate,
  mode
}: {
  currentDate: Date
  mode: Section
}) {
  const [detail, setDetail] = useState<{ title: string; ids: number[] } | null>(null)
  const section = mode
  const [data, setData] = useState<{
    bookID: number
    workspace: Workspace
    report: InsightReport | null
  } | null>(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [snapshotOpen, setSnapshotOpen] = useState(false)
  const [snapshotError, setSnapshotError] = useState('')
  const [capturing, setCapturing] = useState(false)
  const busy = useRef(false)
  const shown = useRef(false)
  const year = currentDate.getFullYear()
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
    let active = true
    setData(null)
    setDraft(null)
    setDetail(null)
    setError('')
    void (async () => {
      const book = await jz.ensureAccountBook()
      const [workspace, report] = await Promise.all([
        jz.api.insights.workspace(book.id),
        mode === 'fixed' && year <= new Date().getFullYear()
          ? jz.api.insights.report(book.id, year)
          : Promise.resolve(null)
      ])
      if (active && book.id === jz.storage.getCurrentAccountBook()?.id)
        setData({ bookID: book.id, workspace: workspace.data, report: report?.data || null })
    })().catch((e: unknown) => {
      if (active) setError(e instanceof Error ? e.message : '归集数据加载失败')
    })
    return () => {
      active = false
    }
  }, [year, reload, mode])
  const capture = async (note: string) => {
    if (!data || busy.current) return
    busy.current = true
    setCapturing(true)
    setSnapshotError('')
    try {
      if (data.bookID !== jz.storage.getCurrentAccountBook()?.id)
        throw new Error('账簿已切换，请重新打开')
      await jz.api.insights.capturePortfolio(data.bookID, note)
      setSnapshotOpen(false)
      setReload((v) => v + 1)
    } catch (e: unknown) {
      setSnapshotError(e instanceof Error ? e.message : '快照保存失败')
    } finally {
      busy.current = false
      setCapturing(false)
    }
  }
  if (!data)
    return (
      <View className="spending-analysis">
        <View className="spending-analysis__empty">{error || '正在汇总归集数据…'}</View>
        {error && <Button title="重新加载" onClick={() => setReload((v) => v + 1)} />}
      </View>
    )
  const w = data.workspace
  const group = (g: InsightGroup) => (
    <View
      key={g.key}
      className="spending-analysis__category"
      onClick={() => setDetail({ title: g.name, ids: g.statement_ids })}
    >
      <View className="spending-analysis__heading">
        <View>{g.name}</View>
        <View>¥{formatMoney(g.expend_cents)}</View>
      </View>
      <View className="spending-analysis__muted">
        {g.count} 笔 · 最近 {g.last_date}
      </View>
    </View>
  )
  return (
    <View className="spending-analysis">
      <View className="spending-analysis__scope">
        {section === 'fixed'
          ? `当前账簿 · 固定开销候选参考 ${year} 年`
          : section === 'portfolio'
            ? '当前账簿 · 可靠资产快照'
            : '当前账簿 · 全部历史账单'}
      </View>
      {section === 'projects' && (
        <>
          <Button
            title="新增项目"
            onClick={() =>
              setDraft({
                type: 'project',
                value: { id: 0, name: '', budget_cents: 0, archived: false }
              })
            }
          />
          <View className="spending-analysis__muted">
            在账单详情中设置所属项目，同一次旅行的交通、住宿和餐饮可以一起汇总。
          </View>
          {w.projects.length === 0 && <View className="spending-analysis__empty">还没有项目</View>}
          {w.projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              members={w.members}
              onOpen={() =>
                runTask(
                  jz.router.navigateTo({
                    url: `/pages/project/detail?project_id=${p.id}&account_book_id=${data.bookID}`
                  })
                )
              }
              onEdit={p.can_edit ? () => setDraft({ type: 'project', value: p }) : undefined}
            />
          ))}
        </>
      )}
      {section === 'fixed' && (
        <>
          <View className="spending-analysis__card">
            <View className="spending-analysis__heading">已确认的固定开销</View>
            <View className="spending-analysis__total">
              月均 ¥{formatMoney(w.monthly_fixed_cents)}
            </View>
            <View className="spending-analysis__muted">
              预计全年 ¥{formatMoney(w.annual_fixed_cents)} · 按启用规则折算；每天 23:55
              自动检查并记录到期支出
            </View>
            <Button
              title="手动添加固定开销"
              onClick={() =>
                setDraft({
                  type: 'fixed',
                  value: {
                    id: 0,
                    name: '',
                    amount_cents: 0,
                    category_id: 0,
                    asset_id: 0,
                    interval_months: 1,
                    due_day: 1,
                    candidate_key: '',
                    active: true
                  }
                })
              }
            />
          </View>
          {w.fixed_costs.map((f) => (
            <View className="spending-analysis__card" key={f.id}>
              <View className="spending-analysis__heading">
                <View>
                  {f.name}
                  {!f.active ? ' · 已停用' : ''}
                </View>
                <View>¥{formatMoney(f.amount_cents)}</View>
              </View>
              <View className="spending-analysis__muted">
                每 {f.interval_months} 个月 · {f.due_day} 日 · 年预计 ¥{formatMoney(f.annual_cents)}
              </View>
              <View className="spending-analysis__muted">
                {f.active
                  ? f.next_run_date
                    ? `下次记账：${f.next_run_date}`
                    : '请选择分类和钱包后确认启用'
                  : '已暂停自动记账'}
              </View>
              {f.can_edit && (
                <View className="insight-workspace__actions">
                  <View onClick={() => setDraft({ type: 'fixed', value: f })}>编辑 / 停用</View>
                </View>
              )}
            </View>
          ))}
          <View className="spending-analysis__card">
            <View className="spending-analysis__heading">可能的固定开销</View>
            <View className="spending-analysis__muted">
              依据 {year}{' '}
              年至少三个月的相似账单识别，金额取最近一次；确认分类、钱包和周期后才启用自动记账。
            </View>
            {(data.report?.recurring_candidates || [])
              .filter((c) => !w.fixed_costs.some((f) => f.candidate_key === c.key))
              .map((c) => (
                <View key={c.key} className="spending-analysis__category">
                  <View className="spending-analysis__heading">
                    <View>{c.name}</View>
                    <View>¥{formatMoney(c.amount_cents)}</View>
                  </View>
                  <View className="spending-analysis__muted">出现于 {c.months} 个月</View>
                  <Button
                    title="确认并设置周期"
                    onClick={() =>
                      setDraft({
                        type: 'fixed',
                        value: {
                          id: 0,
                          name: c.name,
                          amount_cents: c.amount_cents,
                          category_id: c.category_id,
                          asset_id: c.asset_id,
                          interval_months: 1,
                          due_day: c.due_day,
                          candidate_key: c.key,
                          active: true
                        }
                      })
                    }
                  />
                </View>
              ))}
            {!(data.report?.recurring_candidates || []).some(
              (c) => !w.fixed_costs.some((f) => f.candidate_key === c.key)
            ) && <View className="spending-analysis__empty">暂无待确认候选，可以手动添加</View>}
          </View>
        </>
      )}
      {section === 'payments' && (
        <>
          <View className="spending-analysis__card">
            <View className="spending-analysis__heading">谁实际付款</View>
            <View className="spending-analysis__muted">
              与记账人分开统计，在账单详情设置。未填写付款人：¥{formatMoney(w.unknown_payer_cents)}
            </View>
            {w.payers.map(group)}
          </View>
          <View className="spending-analysis__card">
            <View className="spending-analysis__heading">各自承担多少</View>
            <View className="spending-analysis__muted">
              按账单已确认的分摊统计。未分摊：¥{formatMoney(w.unallocated_cents)}
            </View>
            {w.burdens.map(group)}
            {w.invalid_split_count > 0 && (
              <View className="insight-workspace__error">
                {w.invalid_split_count} 笔账单金额已变化，请到详情重新确认分摊。
              </View>
            )}
          </View>
        </>
      )}
      {section === 'portfolio' && (
        <>
          <View className="spending-analysis__card">
            <View className="spending-analysis__heading">资产与负债历史</View>
            <View className="spending-analysis__muted">
              保存此刻资产余额作为快照。首次快照之前没有可靠历史，留空；快照间展示各资产余额变化，不能直接解释为消费。
            </View>
            <Button
              title="保存当前资产快照"
              onClick={() => {
                setSnapshotError('')
                setSnapshotOpen(true)
              }}
            />
            {error && <View className="insight-workspace__error">{error}</View>}
          </View>
          {w.portfolio.length === 0 && (
            <View className="spending-analysis__empty">尚无资产快照</View>
          )}
          {[...w.portfolio].reverse().map((p) => (
            <View className="spending-analysis__card" key={p.id}>
              <View className="spending-analysis__heading">
                {p.date.slice(0, 10)} {p.date.slice(11, 16)}
              </View>
              <View className="spending-analysis__total">净资产 ¥{formatMoney(p.net_cents)}</View>
              <View className="spending-analysis__muted">
                资产 ¥{formatMoney(p.assets_cents)} · 负债 ¥{formatMoney(p.liabilities_cents)}
              </View>
              {p.note && <View>{p.note}</View>}
              <View className="spending-analysis__change">
                {p.delta_cents === null
                  ? '首次快照，暂无对比'
                  : `较上次 ${p.delta_cents >= 0 ? '+' : '-'}¥${formatMoney(Math.abs(p.delta_cents))}`}
              </View>
              {p.changes.map((c) => (
                <View className="spending-analysis__category" key={c.id}>
                  <View>
                    {c.name} · {c.reason}
                  </View>
                  <View className="spending-analysis__muted">
                    余额 {c.before_cents === null ? '未纳入快照' : formatMoney(c.before_cents)} →{' '}
                    {c.after_cents === null ? '已移出快照' : formatMoney(c.after_cents)} ·
                    净资产贡献 {c.net_delta_cents >= 0 ? '+' : '-'}¥
                    {formatMoney(Math.abs(c.net_delta_cents))}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </>
      )}
      {snapshotOpen && data && (
        <SnapshotDialog
          saving={capturing}
          error={snapshotError}
          onClose={() => {
            if (!capturing) setSnapshotOpen(false)
          }}
          onConfirm={(note) => void capture(note)}
        />
      )}
      {detail && (
        <GroupDetails
          bookID={data.bookID}
          title={detail.title}
          ids={detail.ids}
          onClose={() => setDetail(null)}
        />
      )}
      {draft && (
        <EditRule
          members={w.members}
          bookID={data.bookID}
          draft={draft}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null)
            setReload((v) => v + 1)
          }}
        />
      )}
    </View>
  )
}
