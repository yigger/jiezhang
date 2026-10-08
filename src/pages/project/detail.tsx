import type { InsightWorkspace } from '@/api/logic/insights'
import type { StatementListItem } from '@/api/types'
import BasePage from '@/components/BasePage'
import Statement from '@/components/Statement'
import QuickStatementModal from '@/components/SuggestedStatement/QuickStatementModal'
import EditRule from '@/components/Statistic/InsightWorkspace/EditRule'
import { Button, Tabs } from '@/src/components/UiComponents'
import jz from '@/jz'
import { groupProjectStatements } from '@/utils/project-analysis'
import type { ProjectGroupBy } from '@/utils/project-analysis'
import { projectAppearance } from '@/utils/project-appearance'
import { formatMoney } from '@/utils/spending-analysis'
import { Picker, View } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import '@/src/styles'

type Loaded = { bookID: number; workspace: InsightWorkspace; rows: StatementListItem[] }
export default function ProjectDetail() {
  const params = jz.router.getParams()
  const projectID = Number(params.project_id)
  const targetBook = Number(params.account_book_id)
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [view, setView] = useState<'group' | 'list'>('group')
  const [by, setBy] = useState<ProjectGroupBy>('consumer')
  const [all, setAll] = useState(false)
  const [limit, setLimit] = useState(20)
  const [groupLimits, setGroupLimits] = useState<Record<string, number>>({})
  const [quick, setQuick] = useState(false)
  const [edit, setEdit] = useState(false)
  const shown = useRef(false)
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
    setError('')
    void (async () => {
      const book = await jz.ensureAccountBook()
      if (!projectID || book.id !== targetBook)
        throw new Error('项目不属于当前账簿，请返回项目列表')
      const [workspace, statements] = await Promise.all([
        jz.api.insights.workspace(book.id),
        jz.api.superStatements.getStatements({ account_book_id: book.id, order_by: 'created_at' })
      ])
      const p = workspace.data.projects.find((item) => item.id === projectID)
      if (!p) throw new Error('项目不存在')
      const ids = new Set(p.summary.statement_ids)
      if (active && book.id === jz.storage.getCurrentAccountBook()?.id)
        setData({
          bookID: book.id,
          workspace: workspace.data,
          rows: statements.data.data
            .filter((s) => ids.has(s.id))
            .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
        })
    })().catch((e: unknown) => {
      if (active) setError(e instanceof Error ? e.message : '项目加载失败')
    })
    return () => {
      active = false
    }
  }, [projectID, targetBook, reload])
  const p = data?.workspace.projects.find((item) => item.id === projectID)
  if (!data || !p || error)
    return (
      <BasePage headerName="项目详情" forceShowNavigatorBack>
        <View className="spending-analysis__empty">{error || '正在加载项目…'}</View>
        {error && <Button title="重新加载" onClick={() => setReload((v) => v + 1)} />}
      </BasePage>
    )
  const appearance = projectAppearance(p)
  const members = p.participant_ids?.length
    ? data.workspace.members.filter((m) => p.participant_ids?.includes(m.id))
    : data.workspace.members
  const rows = data.rows.filter((r) => all || r.type === 'expend')
  const groups = groupProjectStatements(
    rows,
    data.workspace.annotations,
    data.workspace.members,
    by
  )
  const name = (id: number | null | undefined) =>
    id ? data.workspace.members.find((m) => m.id === id)?.name || `成员 ${id}` : '未指定'
  const row = (s: StatementListItem) => {
    const a = data.workspace.annotations.find((x) => x.statement_id === s.id)
    const outside = (p.start_date && s.date < p.start_date) || (p.end_date && s.date > p.end_date)
    return (
      <View key={s.id}>
        <View className="project-detail__badge">
          消费人 {name(a?.consumer_id)} · 付款人 {name(a?.payer_id)}
          {outside ? ' · 计划时间外' : ''}
        </View>
        <Statement statement={s} />
      </View>
    )
  }
  return (
    <BasePage headerName="项目详情" forceShowNavigatorBack>
      <View className="project-detail">
        <View
          className="project-detail__hero"
          style={{ background: `linear-gradient(135deg, ${appearance.tint}, #fff)` }}
        >
          <View
            className={`project-detail__identity iconfont ${appearance.icon}`}
            style={{ color: appearance.color, background: appearance.tint }}
          />
          <View className="project-detail__title">{p.name}</View>
          <View className="spending-analysis__muted">
            {p.start_date || '未设开始日期'} — {p.end_date || '未设结束日期'}
            {p.archived ? ' · 已归档' : ''}
          </View>
          <View className="spending-analysis__muted">
            参与人：{members.map((m) => m.name).join('、') || '未设置'}
          </View>
          <View className="spending-analysis__muted">累计支出</View>
          <View className="project-detail__total">¥{formatMoney(p.summary.expend_cents)}</View>
          <View className="project-detail__metrics">
            <View>{data.rows.filter((s) => s.type === 'expend').length} 笔支出</View>
            <View>收入 ¥{formatMoney(p.summary.income_cents)}</View>
            <View>
              {p.budget_cents > 0
                ? `${p.summary.expend_cents > p.budget_cents ? '超预算' : '剩余'} ¥${formatMoney(Math.abs(p.budget_cents - p.summary.expend_cents))}`
                : '未设置预算'}
            </View>
          </View>
          {p.can_edit && (
            <View className="spending-analysis__link" onClick={() => setEdit(true)}>
              编辑项目信息 ›
            </View>
          )}
        </View>
        <View className="project-detail__group">
          <View className="spending-analysis__heading">支出分布</View>
          {p.summary.categories.length ? (
            p.summary.categories.map((c) => (
              <View key={c.id} className="spending-analysis__category">
                <View className="spending-analysis__heading">
                  <View>{c.name}</View>
                  <View>¥{formatMoney(c.amount_cents)}</View>
                </View>
                <View className="spending-analysis__bar">
                  <View
                    style={{
                      width: `${p.summary.expend_cents ? (c.amount_cents / p.summary.expend_cents) * 100 : 0}%`
                    }}
                  />
                </View>
                <View className="spending-analysis__muted">
                  {c.count} 笔 ·{' '}
                  {p.summary.expend_cents
                    ? ((c.amount_cents / p.summary.expend_cents) * 100).toFixed(1)
                    : 0}
                  %
                </View>
              </View>
            ))
          ) : (
            <View className="spending-analysis__empty">还没有支出</View>
          )}
        </View>
        {!p.archived && (
          <View className="project-detail__quick">
            <Button title="项目记一笔" onClick={() => setQuick(true)} />
          </View>
        )}
        <Tabs
          tabs={[
            { id: 'group', title: '分组展示' },
            { id: 'list', title: '逐笔列表' }
          ]}
          current={view}
          onChange={(v) => {
            setView(v)
            setLimit(20)
          }}
        />
        <View className="project-detail__filters">
          {view === 'group' && (
            <Picker
              mode="selector"
              range={['消费人', '分类', '日期']}
              value={['consumer', 'category', 'day'].indexOf(by)}
              onChange={(e) => {
                setBy((['consumer', 'category', 'day'] as ProjectGroupBy[])[Number(e.detail.value)])
                setGroupLimits({})
                setLimit(20)
              }}
            >
              <View>
                按{by === 'consumer' ? '消费人' : by === 'category' ? '分类' : '日期'}分组 ›
              </View>
            </Picker>
          )}
          <View
            onClick={() => {
              setAll((v) => !v)
              setLimit(20)
            }}
          >
            {all ? '全部收支' : '仅支出'} ▾
          </View>
        </View>
        {rows.length === 0 && (
          <View className="spending-analysis__empty">暂无消费记录，点击“项目记一笔”开始记录。</View>
        )}
        {view === 'list' ? (
          <View className="project-detail__group">
            {rows.slice(0, limit).map(row)}
            {rows.length > limit && (
              <Button title="继续查看" onClick={() => setLimit((v) => v + 20)} />
            )}
          </View>
        ) : (
          groups.slice(0, limit).map((g) => (
            <View className="project-detail__group" key={g.key}>
              <View className="spending-analysis__heading">
                <View>{g.name}</View>
                <View>¥{formatMoney(g.expendCents)}</View>
              </View>
              <View className="spending-analysis__muted">
                {g.rows.length} 笔{g.incomeCents ? ` · 收入 ¥${formatMoney(g.incomeCents)}` : ''}
              </View>
              {g.rows.slice(0, groupLimits[g.key] || 5).map(row)}
              {g.rows.length > (groupLimits[g.key] || 5) && (
                <Button
                  title="展开更多账单"
                  onClick={() => setGroupLimits((v) => ({ ...v, [g.key]: (v[g.key] || 5) + 20 }))}
                />
              )}
            </View>
          ))
        )}
        {view === 'group' && groups.length > limit && (
          <Button title="查看更多分组" onClick={() => setLimit((v) => v + 20)} />
        )}
        {edit && (
          <EditRule
            bookID={data.bookID}
            draft={{ type: 'project', value: p }}
            members={data.workspace.members}
            onClose={() => setEdit(false)}
            onSaved={() => {
              setEdit(false)
              setReload((v) => v + 1)
            }}
          />
        )}
        {quick && (
          <QuickStatementModal
            statement={{
              bookId: data.bookID,
              dismissalKey: `project:${p.id}`,
              project: { id: p.id, name: p.name, members }
            }}
            onClose={() => setQuick(false)}
            onSaved={() => {
              setQuick(false)
              jz.event.emit('statement:updated')
              setReload((v) => v + 1)
            }}
          />
        )}
      </View>
    </BasePage>
  )
}
