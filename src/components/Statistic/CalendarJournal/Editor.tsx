import type { CalendarJournalEntry } from '@/api/logic/calendar-journal'
import type { StatementListItem } from '@/api/types'
import jz from '@/jz'
import Statements from '@/components/Statements'
import {
  emptyJournal,
  journalDraftKey,
  journalMoods,
  parseJournalDraft
} from '@/utils/calendar-journal'
import { Button, ScrollView, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { runTask } from '@/utils/async'

export default function JournalEditor({
  book,
  user,
  date,
  entry,
  statements,
  statementsReady,
  onClose,
  onSaved
}: {
  book: number
  user: number
  date: string
  entry?: CalendarJournalEntry
  statements: StatementListItem[]
  statementsReady: boolean
  onClose: () => void
  onSaved: (entry: CalendarJournalEntry) => void
}) {
  const key = journalDraftKey(user, book, date)
  const [draft, setDraft] = useState(() => {
    try {
      return parseJournalDraft(Taro.getStorageSync(key), date) ?? entry ?? emptyJournal(date)
    } catch {
      return entry ?? emptyJournal(date)
    }
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [restored] = useState(() => {
    try {
      return !!parseJournalDraft(Taro.getStorageSync(key), date)
    } catch {
      return false
    }
  })
  const mounted = useRef(true)
  const busy = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const hasExpense = statements.some((item) => item.type === 'expend')
  const update = (next: CalendarJournalEntry) => {
    if (busy.current) return
    setDraft(next)
    setError('')
    try {
      Taro.setStorageSync(key, next)
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }
  const save = async () => {
    if (busy.current) return
    busy.current = true
    setSaving(true)
    setError('')
    const submitted = { ...draft, zero_expense: draft.zero_expense && !hasExpense }
    try {
      const { data } = await jz.api.calendarJournal.save(book, submitted)
      // A reopened editor may already contain newer input. Keep that draft.
      try {
        const stored = parseJournalDraft(Taro.getStorageSync(key), date)
        if (stored && JSON.stringify(stored) === JSON.stringify(draft)) Taro.removeStorageSync(key)
      } catch {
        /* Saving to the server succeeded; local cleanup is best effort. */
      }
      onSaved(data)
      if (mounted.current) onClose()
    } catch (e: unknown) {
      if (mounted.current) setError(e instanceof Error ? e.message : '未保存，请重试')
    } finally {
      busy.current = false
      if (mounted.current) setSaving(false)
    }
  }
  const total = statements.reduce(
    (sum, item) => sum + (item.type === 'expend' ? Number(item.amount) : 0),
    0
  )
  return (
    <View className="journal-sheet">
      <View className="journal-sheet__mask" onClick={onClose} />
      <View className="journal-sheet__panel">
        <View className="journal-sheet__handle" />
        <View className="journal-sheet__header">
          <View>
            <View className="journal-eyebrow">A LITTLE MOMENT</View>
            <View className="journal-title">{date.slice(5).replace('-', '月')}日 · 留住今天</View>
          </View>
          <Button className="journal-close" onClick={onClose} aria-label="关闭手帐">
            ×
          </Button>
        </View>
        <ScrollView scrollY className="journal-sheet__body">
          <View className="journal-label">
            今天，是什么天气？<View className="journal-muted">选一个心情，再点一次可取消</View>
          </View>
          <View className="journal-moods">
            {journalMoods.map((mood) => (
              <Button
                key={mood.id}
                disabled={saving}
                className={`journal-mood ${draft.mood === mood.id ? 'is-active' : ''}`}
                onClick={() => update({ ...draft, mood: draft.mood === mood.id ? '' : mood.id })}
              >
                <View className="journal-mood__icon">{mood.icon}</View>
                <View>{mood.name}</View>
              </Button>
            ))}
          </View>
          <View className="journal-label">给今天留一句话</View>
          <View className="journal-paper">
            <Textarea
              value={draft.note}
              disabled={saving}
              maxlength={200}
              placeholder="一顿好吃的饭，一阵晚风，或者什么也没发生。"
              onInput={(e) => update({ ...draft, note: e.detail.value })}
              className="journal-note"
              cursorSpacing={24}
            />
            <View className="journal-counter">{Array.from(draft.note).length} / 200</View>
          </View>
          <Button
            disabled={saving || !statementsReady || hasExpense}
            className={`journal-stamp ${draft.zero_expense && !hasExpense ? 'is-active' : ''}`}
            onClick={() => update({ ...draft, zero_expense: !draft.zero_expense })}
          >
            <View className="journal-stamp__icon">🌿</View>
            <View className="journal-stamp__copy">
              <View>
                {hasExpense
                  ? '今天也有值得记录的消费'
                  : draft.zero_expense
                    ? '今天零消费，已盖章'
                    : '今天没花钱？盖一枚小叶子'}
              </View>
              <View className="journal-muted">
                {!statementsReady
                  ? '正在确认当天账单…'
                  : hasExpense
                    ? `已记录支出 ¥${total.toFixed(2)}`
                    : '由你确认，空白日期不会自动算零消费'}
              </View>
            </View>
          </Button>
          <View className="journal-ledger-header">
            <View className="journal-label">当天账单</View>
            <Button
              className="journal-text-button"
              onClick={() => {
                onClose()
                runTask(jz.router.navigateTo({ url: `/pages/statement/form?date=${date}` }))
              }}
            >
              ＋ 补记一笔
            </Button>
          </View>
          {!statementsReady ? (
            <View className="journal-muted">账单尚未加载，可关闭面板后重试</View>
          ) : statements.length ? (
            <Statements statements={statements} />
          ) : (
            <View className="journal-empty">没有账单，也可以留下生活的小片段。</View>
          )}
        </ScrollView>
        <View className="journal-sheet__footer">
          {error && <View className="journal-error">未保存 · {error}</View>}
          <View className="journal-muted">
            {storageError
              ? '本地草稿保存失败，请先保存再关闭'
              : restored
                ? '已恢复草稿 · 内容仅你可见'
                : '自动保留本地草稿 · 内容仅你可见'}
          </View>
          <View className="journal-actions">
            <Button className="journal-secondary" onClick={onClose}>
              先收起来
            </Button>
            <Button
              className="journal-primary"
              loading={saving}
              disabled={saving}
              onClick={() => {
                void save()
              }}
            >
              保存今天
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
