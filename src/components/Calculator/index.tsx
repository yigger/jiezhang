import { View } from '@tarojs/components'
import { initialCalculator, pressCalculatorKey } from '@/utils/calculator'
import React, { useRef } from 'react'
import '@/src/styles'

export interface CalculatorValue {
  value: string
  operator: string
  prev: string
}
interface CalculatorProps {
  value: string
  onChange: (value: CalculatorValue) => void
  onClose: () => void
  embedded?: boolean
  replaceOnInput?: boolean
  confirmText?: string
}

const Calculator: React.FC<CalculatorProps> = ({
  value,
  onChange,
  onClose,
  embedded = false,
  replaceOnInput = false,
  confirmText = '确定'
}) => {
  const state = useRef(initialCalculator(value, replaceOnInput))

  const handleKey = (key: string) => {
    const next = pressCalculatorKey(state.current, key)
    state.current = next
    onChange({ value: next.value, operator: next.operator, prev: next.prev })
    if (key === 'OK') onClose()
  }

  return (
    <View className={`calculator ${embedded ? 'calculator--embedded' : ''}`}>
      <View className="calculator__keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
          <View
            key={key}
            className={`key calculator__number calculator__number--${key}`}
            onClick={() => handleKey(key)}
          >
            {key}
          </View>
        ))}
        <View className="key calculator__delete" aria-label="退格" onClick={() => handleKey('DEL')}>
          <View className="calculator__delete-icon">×</View>
        </View>
        <View className="key calculator__zero" onClick={() => handleKey('0')}>
          0
        </View>
        <View className="key calculator__decimal" onClick={() => handleKey('.')}>
          .
        </View>
        <View className="key calculator__confirm" onClick={() => handleKey('OK')}>
          {confirmText}
        </View>
      </View>
    </View>
  )
}

export default Calculator
