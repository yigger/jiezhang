import Calculator from '@/components/Calculator'
import { View } from '@tarojs/components'
import { useRef, useState } from 'react'

export default function AmountField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const result = useRef(value)
  return (
    <View className="insight-workspace__field">
      <View>{label}</View>
      <View
        className="insight-workspace__amount"
        onClick={() => {
          result.current = value
          setDraft(value)
        }}
      >
        ¥{value || '0.00'} · 点击计算
      </View>
      {draft !== null && (
        <View>
          <View className="spending-analysis__heading">
            <View>¥{draft}</View>
            <View className="spending-analysis__link" onClick={() => setDraft(null)}>
              取消
            </View>
          </View>
          <Calculator
            key={label}
            value={value || '0'}
            embedded
            replaceOnInput
            confirmText="使用金额"
            onChange={(v) => {
              result.current = v.value
              setDraft(v.value)
            }}
            onClose={() => {
              onChange(result.current)
              setDraft(null)
            }}
          />
        </View>
      )}
    </View>
  )
}
