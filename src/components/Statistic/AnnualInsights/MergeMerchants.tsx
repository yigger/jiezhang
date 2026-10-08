import type { InsightGroup } from '@/api/logic/insights'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import { Input, ScrollView, Switch, View } from '@tarojs/components'
import { useRef, useState } from 'react'
import '@/src/styles'
export default function MergeMerchants({
  bookID,
  groups,
  onClose,
  onSaved
}: {
  bookID: number
  groups: InsightGroup[]
  onClose: () => void
  onSaved: () => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const busy = useRef(false)
  const save = async (reset = false) => {
    if (busy.current) return
    const ids = [
      ...new Set(
        groups
          .filter((g) => selected.includes(g.key))
          .flatMap((g) => g.ids)
          .filter((id) => id > 0)
      )
    ]
    if (!ids.length || (!reset && !name.trim())) {
      setError('请选择商家并填写统一名称')
      return
    }
    if (ids.length > 100) {
      setError('一次最多合并 100 个商家，请分批设置')
      return
    }
    busy.current = true
    setSaving(true)
    setError('')
    try {
      if (bookID !== jz.storage.getCurrentAccountBook()?.id)
        throw new Error('账簿已切换，请重新打开')
      await jz.api.insights.mergeMerchants(bookID, ids, reset ? '' : name.trim())
      jz.event.emit('statement:updated')
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }
  return (
    <View className="spending-details">
      <View
        className="spending-details__mask"
        onClick={() => {
          if (!saving) onClose()
        }}
      />
      <View className="spending-details__panel">
        <View className="spending-analysis__heading">
          <View>合并商家统计</View>
          <View
            className="spending-analysis__link"
            onClick={() => {
              if (!saving) onClose()
            }}
          >
            关闭
          </View>
        </View>
        <ScrollView scrollY className="spending-details__list">
          <View className="spending-analysis__muted">
            选择同一家商家的不同名称，设置统一汇总名称。账单和原商家名称保持原样，也可以恢复。
          </View>
          {groups
            .filter((g) => g.ids.some((id) => id > 0))
            .map((g) => (
              <View key={g.key} className="spending-analysis__heading insight-workspace__field">
                <View>{g.name}</View>
                <Switch
                  checked={selected.includes(g.key)}
                  disabled={saving}
                  onChange={(e) =>
                    setSelected((v) =>
                      e.detail.value ? [...v, g.key] : v.filter((k) => k !== g.key)
                    )
                  }
                />
              </View>
            ))}
          <View className="insight-workspace__field">
            统一汇总名称
            <Input
              value={name}
              maxlength={100}
              placeholder="例如：星巴克"
              onInput={(e) => setName(e.detail.value)}
            />
          </View>
          {error && <View className="insight-workspace__error">{error}</View>}
          <Button title={saving ? '保存中…' : '合并统计'} onClick={() => void save()} />
          <Button title="恢复所选商家的原名" onClick={() => void save(true)} />
        </ScrollView>
      </View>
    </View>
  )
}
