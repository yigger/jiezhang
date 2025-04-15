import { View, Text } from '@tarojs/components'
import React, { useState } from 'react'
import './index.scss'

interface CalculatorProps {
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

const Calculator: React.FC<CalculatorProps> = ({ value, onChange, onClose }) => {
  const [displayValue, setDisplayValue] = useState(value || '0')
  const [hasDecimal, setHasDecimal] = useState(false)
  const [prevValue, setPrevValue] = useState('')
  const [operator, setOperator] = useState('')

  const handleNumber = (num: string) => {
    let newValue = displayValue
    if (displayValue === '0' && num !== '.') {
      newValue = num
    } else {
      if (num === '.' && !hasDecimal) {
        setHasDecimal(true)
        newValue = displayValue + num
      } else if (num !== '.') {
        newValue = displayValue + num
      }
    }
    setDisplayValue(newValue)
    onChange({ value: newValue, operator: '', prev: '' })
  }

  const calculate = () => {
    if (!prevValue || !operator) return displayValue
    const prev = parseFloat(prevValue)
    const current = parseFloat(displayValue)
    let result = 0

    switch (operator) {
      case '+':
        result = prev + current
        break
      case '-':
        result = prev - current
        break
    }

    return result.toString()
  }

  const handleOperator = (op: string) => {
    switch (op) {
      case '+':
      case '-':
        if (prevValue && operator) {
          const result = calculate()
          setPrevValue(result)
          setDisplayValue('0')
          setOperator(op)
          onChange({ value: '0', operator: op, prev: result })
        } else {
          setPrevValue(displayValue)
          setDisplayValue('0')
          setOperator(op)
          onChange({ value: '0', operator: op, prev: displayValue })
        }
        break
      case 'OK':
        if (operator) {
          const result = calculate()
          onChange({ value: result, operator: '', prev: '' })
        }
        onClose()
        break
      case '=':
        const result = calculate()
        setDisplayValue(result)
        setPrevValue('')
        setOperator('')
        setHasDecimal(result.includes('.'))
        onChange(result)
        break
      case 'DEL':
        if (displayValue.length > 1) {
          const newValue = displayValue.slice(0, -1)
          setDisplayValue(newValue)
          onChange({ value: newValue, operator, prev: prevValue })
          if (displayValue.slice(-1) === '.') {
            setHasDecimal(false)
          }
        } else {
          setDisplayValue('0')
          onChange({ value: '0', operator, prev: prevValue })
        }
        break
    }
  }

  return (
    <View className='calculator'>
      <View className='calculator__keypad'>
        <View className='keypad-left'>
          <View className='row'>
            <View className='key' onClick={() => handleNumber('7')}>7</View>
            <View className='key' onClick={() => handleNumber('8')}>8</View>
            <View className='key' onClick={() => handleNumber('9')}>9</View>
          </View>
          <View className='row'>
            <View className='key' onClick={() => handleNumber('4')}>4</View>
            <View className='key' onClick={() => handleNumber('5')}>5</View>
            <View className='key' onClick={() => handleNumber('6')}>6</View>
          </View>
          <View className='row'>
            <View className='key' onClick={() => handleNumber('1')}>1</View>
            <View className='key' onClick={() => handleNumber('2')}>2</View>
            <View className='key' onClick={() => handleNumber('3')}>3</View>
          </View>
          <View className='row'>
            <View className='key' onClick={() => handleNumber('.')}>.</View>
            <View className='key' onClick={() => handleNumber('0')}>0</View>
            <View className='key' onClick={() => handleOperator('DEL')}>←</View>
          </View>
        </View>
        <View className='keypad-right'>
          <View className='key operator' onClick={() => handleOperator('+')}>+</View>
          <View className='key operator' onClick={() => handleOperator('-')}>-</View>
          <View className='key operator confirm' onClick={() => handleOperator('OK')}>确定</View>
        </View>
      </View>
    </View>
  )
}

export default Calculator