import type { StatementListItem } from '@/api/types'
import jz from '@/jz'
import Statements from '@/components/Statements'
import { Button } from '@/src/components/UiComponents'
import { ScrollView, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
export default function GroupDetails({
  bookID,
  title,
  ids,
  onClose
}: {
  bookID: number
  title: string
  ids: number[]
  onClose: () => void
}) {
  const [rows, setRows] = useState<StatementListItem[] | null>(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [limit, setLimit] = useState(20)
  useEffect(() => {
    let active = true
    setRows(null)
    setError('')
    const wanted = new Set(ids)
    void jz.api.superStatements
      .getStatements({ account_book_id: bookID, order_by: 'created_at' })
      .then((r) => {
        if (active && bookID === jz.storage.getCurrentAccountBook()?.id)
          setRows(
            r.data.data
              .filter((s) => wanted.has(s.id))
              .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
          )
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : '明细加载失败')
      })
    return () => {
      active = false
    }
  }, [bookID, ids, reload])
  return (
    <View className="spending-details">
      <View className="spending-details__mask" onClick={onClose} />
      <View className="spending-details__panel">
        <View className="spending-analysis__heading">
          <View>{title} · 明细</View>
          <View className="spending-analysis__link" onClick={onClose}>
            关闭
          </View>
        </View>
        <ScrollView scrollY className="spending-details__list">
          {error ? (
            <>
              <View className="spending-analysis__empty">{error}</View>
              <Button title="重新加载" onClick={() => setReload((v) => v + 1)} />
            </>
          ) : rows === null ? (
            <View className="spending-analysis__empty">正在加载…</View>
          ) : (
            <>
              <Statements statements={rows.slice(0, limit)} />
              {rows.length === 0 && <View className="spending-analysis__empty">暂无账单</View>}
              {rows.length > limit && (
                <Button title="继续查看" onClick={() => setLimit((v) => v + 20)} />
              )}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  )
}
