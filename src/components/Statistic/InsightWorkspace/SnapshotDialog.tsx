import { Button } from '@/src/components/UiComponents'
import { Textarea, View } from '@tarojs/components'
import { useState } from 'react'
export default function SnapshotDialog({
  saving,
  error,
  onClose,
  onConfirm
}: {
  saving: boolean
  error: string
  onClose: () => void
  onConfirm: (note: string) => void
}) {
  const [note, setNote] = useState('')
  return (
    <View className="spending-details">
      <View
        className="spending-details__mask"
        onClick={() => {
          if (!saving) onClose()
        }}
      />
      <View className="spending-details__panel insight-workspace__snapshot-dialog">
        <View className="spending-analysis__heading">保存资产历史</View>
        <View className="spending-analysis__muted">为这次资产快照添加备注，方便以后回看。</View>
        <Textarea
          value={note}
          maxlength={255}
          disabled={saving}
          placeholder="例如：发薪后、旅行结束、月末盘点（可选）"
          onInput={(e) => setNote(e.detail.value)}
        />
        {error && <View className="insight-workspace__error">{error}</View>}
        <View className="insight-workspace__actions">
          <Button title="取消" disabled={saving} onClick={onClose} />
          <Button
            title={saving ? '正在保存…' : '确定保存'}
            disabled={saving}
            onClick={() => onConfirm(note.trim())}
          />
        </View>
      </View>
    </View>
  )
}
