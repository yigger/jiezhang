import { View } from '@tarojs/components'
import { initialCalculator, pressCalculatorKey } from '@/utils/calculator'
import React, { useRef } from 'react'
import './index.scss'

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
        <View className="keypad-left">
          <View className="row">
            <View className="key" onClick={() => handleKey('7')}>
              7
            </View>
            <View className="key" onClick={() => handleKey('8')}>
              8
            </View>
            <View className="key" onClick={() => handleKey('9')}>
              9
            </View>
          </View>
          <View className="row">
            <View className="key" onClick={() => handleKey('4')}>
              4
            </View>
            <View className="key" onClick={() => handleKey('5')}>
              5
            </View>
            <View className="key" onClick={() => handleKey('6')}>
              6
            </View>
          </View>
          <View className="row">
            <View className="key" onClick={() => handleKey('1')}>
              1
            </View>
            <View className="key" onClick={() => handleKey('2')}>
              2
            </View>
            <View className="key" onClick={() => handleKey('3')}>
              3
            </View>
          </View>
          <View className="row">
            <View className="key" onClick={() => handleKey('.')}>
              .
            </View>
            <View className="key" onClick={() => handleKey('0')}>
              0
            </View>
            <View className="key" onClick={() => handleKey('DEL')}>
              ←
            </View>
          </View>
        </View>
        <View className="keypad-right">
          <View className="key operator" onClick={() => handleKey('+')}>
            +
          </View>
          <View className="key operator" onClick={() => handleKey('-')}>
            -
          </View>
          <View className="key operator confirm" onClick={() => handleKey('OK')}>
            {confirmText}
          </View>
        </View>
      </View>
    </View>
  )
}

export default Calculator
