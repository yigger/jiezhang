import type { StatementListItem } from '@/api/types'
import jz from '@/jz'
import { suggestStatement } from '@/utils/statement-suggestion'
import { View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { format, subDays } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import QuickStatementModal from './QuickStatementModal'
import type { QuickStatement } from './QuickStatementModal'
import './index.scss'

export default function SuggestedStatement() {
  const [history, setHistory] = useState<StatementListItem[]>([])
  const [bookId, setBookId] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [reload, setReload] = useState(0)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [statement, setStatement] = useState<QuickStatement | null>(null)
  const hasShown = useRef(false)

  useDidShow(() => {
    setNow(new Date())
    if (hasShown.current) setReload((value) => value + 1)
    hasShown.current = true
  })

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    const refresh = () => {
      setNow(new Date())
      setReload((value) => value + 1)
    }
    jz.event.on('statement:updated', refresh)
    return () => {
      clearInterval(timer)
      jz.event.off('statement:updated', refresh)
    }
  }, [])

  useEffect(() => {
    let active = true
    const fetchHistory = async () => {
      const book = await jz.ensureAccountBook()
      const current = new Date()
      const { data } = await jz.api.statements.list({
        account_book_id: book.id,
        start_date: format(subDays(current, 28), 'yyyy-MM-dd'),
        end_date: format(current, 'yyyy-MM-dd'),
        limit: 1000,
        order_by: 'created_at desc'
      })
      if (!active || book.id !== jz.storage.getCurrentAccountBook()?.id) return
      const userId = jz.currentUser?.id
      if (userId) {
        const stored = jz.storage.getLocal<unknown>(
          `statementSuggestionsDismissed_${userId}_${book.id}`
        )
        if (Array.isArray(stored))
          setDismissed(stored.filter((value): value is string => typeof value === 'string'))
      }
      setBookId(book.id)
      setHistory(data)
    }
    // A missing suggestion must never interrupt normal bookkeeping.
    void fetchHistory().catch(() => {
      if (active) setHistory([])
    })
    return () => {
      active = false
    }
  }, [reload])

  const suggestion = useMemo(() => suggestStatement(history, now), [history, now])
  const dismissalKey = suggestion ? `${format(now, 'yyyy-MM-dd')}:${suggestion.key}` : ''
  const visible = suggestion && !dismissed.includes(dismissalKey)

  const dismiss = (key: string) => {
    const today = `${format(new Date(), 'yyyy-MM-dd')}:`
    const next = [...new Set([...dismissed.filter((value) => value.startsWith(today)), key])]
    setDismissed(next)
    const userId = jz.currentUser?.id
    if (userId) {
      try {
        jz.storage.saveLocal(`statementSuggestionsDismissed_${userId}_${bookId}`, next, 1)
      } catch {
        /* Keep the dismissal for this visit if local storage is unavailable. */
      }
    }
  }

  return (
    <>
      {visible && (
        <View className="statement-suggestion">
          <View
            className="statement-suggestion__content"
            onClick={() => setStatement({ suggestion, dismissalKey, bookId })}
          >
            <View className="statement-suggestion__title">
              是不是想要记{suggestion.source.description || suggestion.source.category}？
            </View>
            <View className="statement-suggestion__hint">
              {suggestion.source.type === 'expend' ? '支出' : '收入'} · ¥{suggestion.amount} ·
              点一下确认
            </View>
          </View>
          <View className="statement-suggestion__dismiss" onClick={() => dismiss(dismissalKey)}>
            暂不需要
          </View>
        </View>
      )}
      {statement && (
        <QuickStatementModal
          statement={statement}
          onClose={() => setStatement(null)}
          onSaved={() => {
            dismiss(statement.dismissalKey)
            setStatement(null)
            jz.event.emit('statement:updated')
            void Taro.showToast({ title: '记好了', icon: 'success' }).catch(() => undefined)
          }}
        />
      )}
    </>
  )
}
