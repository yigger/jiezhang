import type { CalendarJournalEntry } from '@/api/logic/calendar-journal'
import type { CalendarDataItem, StatementListItem } from '@/api/types'
import Statements from '@/components/Statements'
import jz from '@/jz'
import { HomeStoreContext } from '@/src/stores'
import { journalMoods } from '@/utils/calendar-journal'
import { Button, Text, View } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { format, getDay, getDaysInMonth, startOfMonth } from 'date-fns'
import { observer } from 'mobx-react'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import JournalEditor from './CalendarJournal/Editor'
import './CalendarJournal/index.scss'

export default observer(function CalendarStatistic({ currentDate }: { currentDate: Date }) {
  const home = useContext(HomeStoreContext)
  const book = home.currentAccountBook.id
  const [user, setUser] = useState(() => jz.storage.getCurrentUser()?.id ?? 0)
  const month = format(currentDate, 'yyyy-MM')
  const scope = `${user}:${book}:${month}`
  const scopeRef = useRef(scope)
  scopeRef.current = scope
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selected, setSelected] = useState(today)
  const selectedDate = selected.startsWith(month) ? selected : `${month}-01`
  const [revision, setRevision] = useState(0)
  const [remote, setRemote] = useState<{ scope: string; days: CalendarDataItem[] }>({
    scope: '',
    days: []
  })
  const [journal, setJournal] = useState<{ scope: string; entries: CalendarJournalEntry[] }>({
    scope: '',
    entries: []
  })
  const [daily, setDaily] = useState<{ key: string; rows: StatementListItem[] }>({
    key: '',
    rows: []
  })
  const [errors, setErrors] = useState({ scope: '', calendar: '', journal: '' })
  const [dailyError, setDailyError] = useState({ key: '', message: '' })
  const [editorDate, setEditorDate] = useState<string | null>(null)
  const dailyKey = `${book}:${selectedDate}`
  const statementsReady = daily.key === dailyKey
  const statements = statementsReady ? daily.rows : []
  const entries = journal.scope === scope ? journal.entries : []
  const journalReady = journal.scope === scope
  const currentEntry = entries.find((entry) => entry.date === selectedDate)
  const canEdit = selectedDate <= today
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  useEffect(() => {
    if (user) return
    let active = true
    void jz
      .initialize()
      .then(() => {
        if (active) setUser(jz.storage.getCurrentUser()?.id ?? 0)
      })
      .catch(() => {
        if (active) jz.toastError('用户信息加载失败，请稍后重新打开日历')
      })
    return () => {
      active = false
    }
  }, [user])
  useDidShow(() => setRevision((value) => value + 1))
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    jz.event.on('statement:updated', refresh)
    return () => jz.event.off('statement:updated', refresh)
  }, [])
  useEffect(() => {
    setEditorDate(null)
  }, [scope])

  useEffect(() => {
    if (!book) return
    let active = true
    setErrors({ scope, calendar: '', journal: '' })
    const message = (error: unknown) =>
      error instanceof Error ? error.message : '加载失败，请重试'
    void jz.api.statistics
      .getCalendarData(month, book)
      .then(({ data }) => {
        if (active) setRemote({ scope, days: data.data })
      })
      .catch((error: unknown) => {
        if (active) setErrors((old) => ({ ...old, calendar: message(error) }))
      })
    void jz.api.calendarJournal
      .month(book, month)
      .then(({ data }) => {
        if (!active) return
        setJournal({ scope, entries: data.entries })
        if (data.revoked_dates.length) jz.toastError('已补记支出，对应日期的零消费印章已取消')
      })
      .catch((error: unknown) => {
        if (active) setErrors((old) => ({ ...old, journal: message(error) }))
      })
    return () => {
      active = false
    }
  }, [book, month, scope, revision])

  useEffect(() => {
    if (!book) return
    let active = true
    setDailyError({ key: dailyKey, message: '' })
    // Do not show old-day amounts while the next day's request is pending.
    setDaily({ key: '', rows: [] })
    void jz.api.statements
      .list({ account_book_id: book, start_date: selectedDate, end_date: selectedDate })
      .then(({ data }) => {
        if (active) setDaily({ key: dailyKey, rows: data })
      })
      .catch((e: unknown) => {
        if (active)
          setDailyError({ key: dailyKey, message: e instanceof Error ? e.message : '账单加载失败' })
      })
    return () => {
      active = false
    }
  }, [book, selectedDate, dailyKey, revision])

  const cells = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number)
    const date = new Date(year, monthNumber - 1, 1)
    const offset = getDay(startOfMonth(date))
    const days = getDaysInMonth(date)
    const result: (CalendarDataItem | null)[] = Array(Math.ceil((offset + days) / 7) * 7).fill(null)
    for (let day = 1; day <= days; day++)
      result[offset + day - 1] = (remote.scope === scope
        ? remote.days.find((item) => item.date === day)
        : undefined) ?? { date: day, income: 0, expend: 0 }
    return result
  }, [month, scope, remote])
  const totals = statements.reduce(
    (sum, item) => {
      if (item.type === 'expend') sum.expend += Number(item.amount)
      if (item.type === 'income') sum.income += Number(item.amount)
      return sum
    },
    { expend: 0, income: 0 }
  )
  const recordedDays = entries.filter(
    (entry) => entry.mood || entry.note || entry.zero_expense
  ).length
  const openEditor = () => {
    if (canEdit && journalReady && user > 0) setEditorDate(selectedDate)
  }
  const retry = () => setRevision((value) => value + 1)

  return (
    <View className="calendar-statistic calendar-journal">
      {errors.scope === scope && (errors.calendar || errors.journal) && (
        <View className="journal-error">
          {errors.calendar && `收支：${errors.calendar}`}{' '}
          {errors.journal && `手帐：${errors.journal}`}
          <Button className="journal-text-button" onClick={retry}>
            重新加载
          </Button>
        </View>
      )}
      {(!journalReady || remote.scope !== scope) &&
        !(errors.scope === scope && (errors.calendar || errors.journal)) && (
          <View className="journal-muted">正在加载日历与手帐…</View>
        )}
      <View className="calendar-grid">
        {weekDays.map((day) => (
          <View key={day} className="week-day">
            {day}
          </View>
        ))}
        {cells.map((day, index) => {
          const date = day ? `${month}-${String(day.date).padStart(2, '0')}` : ''
          const entry = entries.find((item) => item.date === date)
          const mood = journalMoods.find((item) => item.id === entry?.mood)
          return (
            <View
              key={index}
              className={`day-cell ${!day ? 'is-blank' : ''} ${date === today ? 'today' : ''} ${date === selectedDate ? 'selected' : ''} ${date > today ? 'is-future' : ''}`}
              onClick={() => {
                if (!day) return
                setSelected(date)
              }}
            >
              {day && (
                <>
                  <View className="date-number">
                    <Text>{day.date}</Text>
                    {mood && <Text className="journal-day-mood">{mood.icon}</Text>}
                  </View>
                  <View className="amount-bars">
                    {day.income > 0 && (
                      <View className="income-bar">
                        <Text className="amount-text">+{day.income}</Text>
                      </View>
                    )}
                    {day.expend > 0 && (
                      <View className="expend-bar">
                        <Text className="amount-text">−{day.expend}</Text>
                      </View>
                    )}
                  </View>
                  <View className="journal-day-marks">
                    {entry?.zero_expense && day.expend === 0 && <Text>🌿</Text>}
                    {entry?.note && <Text className="journal-note-dot">•</Text>}
                  </View>
                </>
              )}
            </View>
          )
        })}
      </View>
      <View className="journal-month-meta">
        <Text>这个月留住了 {journalReady ? recordedDays : '…'} 天</Text>
        <Text>
          🌿 {journalReady ? entries.filter((entry) => entry.zero_expense).length : '…'} 个零消费日
        </Text>
      </View>
      <View className="journal-legend">
        <Text>☀️ 心情</Text>
        <Text>• 每日一句</Text>
        <Text>🌿 已确认零消费</Text>
      </View>
      <View
        className="journal-day-card"
        onClick={openEditor}
        hoverClass={canEdit && journalReady && user ? 'journal-day-card--pressed' : 'none'}
      >
        <View className="journal-ledger-header">
          <View className="journal-title">
            {Number(selectedDate.slice(5, 7))}月{Number(selectedDate.slice(8))}日的小片段
          </View>
          <View
            className={`journal-text-button ${!canEdit || !journalReady || !user ? 'is-disabled' : ''}`}
          >
            {currentEntry?.note || currentEntry?.mood || currentEntry?.zero_expense
              ? '编辑手帐'
              : '＋ 留一句'}
          </View>
        </View>
        {currentEntry?.note ? (
          <View className="journal-quote">“{currentEntry.note}”</View>
        ) : (
          <View className="journal-muted">
            {canEdit ? '平凡的一天，也有值得留下的小事。' : '未来的小故事，等那天再写。'}
          </View>
        )}
        {currentEntry?.mood && (
          <View className="journal-current-mood">
            {journalMoods.find((mood) => mood.id === currentEntry.mood)?.icon}{' '}
            {journalMoods.find((mood) => mood.id === currentEntry.mood)?.name}
          </View>
        )}
      </View>
      <View className="day-summary">
        <View className="summary-header">当天收支</View>
        {!statementsReady ? (
          <View className="journal-muted">
            {dailyError.key === dailyKey && dailyError.message ? (
              <>
                {dailyError.message}
                <Button className="journal-text-button" onClick={retry}>
                  重试
                </Button>
              </>
            ) : (
              '正在加载当天账单…'
            )}
          </View>
        ) : (
          <View className="summary-content">
            {[
              { label: '支出', value: totals.expend, color: 'col-expend' },
              { label: '收入', value: totals.income, color: 'col-income' },
              { label: '结余', value: totals.income - totals.expend, color: '' }
            ].map((item) => (
              <View className="summary-item" key={item.label}>
                <View className="label">{item.label}</View>
                <View className={`amount ${item.color}`}>{item.value.toFixed(2)}</View>
              </View>
            ))}
          </View>
        )}
      </View>
      {statementsReady && <Statements statements={statements} />}
      {editorDate === selectedDate && journalReady && canEdit && (
        <JournalEditor
          key={`${book}:${selectedDate}`}
          book={book}
          user={user}
          date={selectedDate}
          entry={currentEntry}
          statements={statements}
          statementsReady={statementsReady}
          onClose={() => setEditorDate(null)}
          onSaved={(entry) => {
            if (scopeRef.current !== scope) return
            setJournal((old) => ({
              scope,
              entries: [
                ...(old.scope === scope
                  ? old.entries.filter((item) => item.date !== entry.date)
                  : []),
                entry
              ]
            }))
          }}
        />
      )}
    </View>
  )
})
