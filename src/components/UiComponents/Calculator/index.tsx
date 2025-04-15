import React, { useEffect, useState } from 'react'
import { View } from '@tarojs/components'


export function Calculator({
  setActive,
  submitCallback,
  processCallback,
  defaultNum = '0'
}) {
  const [leftValue, setLeftValue] = useState(defaultNum)
  const [operator, setOperator] = useState(null)
  const [rightValue, setRightValue] = useState('0')
  // 当前操作的指向，左侧还是右侧
  const [currentPoint, setCurrentPoint] = useState('left')
  const [result, setResult] = useState(defaultNum)
  const [display, setDisplay] = useState('0')
  
  useEffect(() => {
    const displayScreen = operator ? `${leftValue}${operator}${rightValue === '0' ? '' : rightValue}` : leftValue
    setDisplay(displayScreen)
    if (typeof processCallback === 'function') {
      processCallback(displayScreen)
    }
  }, [leftValue, operator, rightValue])

  // 处理数字的输入行为 1-9 含小数点
  const handleDigitInput = (key) => {
    if (currentPoint === 'left') {
      // 当已存在结果时，再次输入把当前结果置空
      if (result !== '0') {
        setResult('0')
        setNum('0', key, setLeftValue)
        return
      }
      setNum(leftValue, key, setLeftValue)
    } else {
      setNum(rightValue, key, setRightValue)
    }
  }

  const setNum = (sourceVal, key, setNumFn) => {
    if (key === '.') {
      // 若当前数字已经输入过 . 
      if (sourceVal.includes('.')) {
        return
      } else {
        setNumFn(sourceVal + key)
      }
    } else if (sourceVal === '0') {
      setNumFn(key + '')
    } else {
      setNumFn(sourceVal + key)
    }
  }

  // 清空输入
  const cleanInput = () => {
    setCurrentPoint('left')
    setLeftValue('0')
    setRightValue('0')
    setResult('0')
    setOperator(null)
  }

  // 处理运算符
  const handleOperatorInput = (key) => {
    if (operator) {
      calculateResult({calculatorStay: true})
      setOperator(key)
      setCurrentPoint('right')
    } else {
      setOperator(key)
      setCurrentPoint('right')
    }
  }

  // 计算结果
  const calculateResult = (query={calculatorStay: false}) => {
    let res

    if (!operator) {
      res = Number.parseFloat(leftValue) + Number.parseFloat(rightValue)
    } else {
      const leftNum = Number.parseFloat(leftValue)
      const rightNum = Number.parseFloat(rightValue)
      const operateResult = {
        '+': () => leftNum + rightNum,
        '-': () => leftNum - rightNum,
        '*': () => leftNum * rightNum,
        '/': () => rightNum === 0 ? 0 : (leftNum / rightNum)
      }
      res = operateResult[operator]()
    }

    if (res.toString().includes('.')) {
      res = res.toFixed(2)
    }

    res = res.toString()
    setResult(res)
    setLeftValue(res)
    setCurrentPoint('left')
    setRightValue('0')
    setOperator(null)
    if (typeof submitCallback === 'function') {
      submitCallback(res)
    }
    setActive(query.calculatorStay)
  }

  // 退格键
  const handleBackspace = () => {
    if (currentPoint === 'left') {
      setLeftValue(leftValue.substring(0, leftValue.length - 1) || '0')
    } else {
      if (rightValue.length === 1 && rightValue === '0') {
        setOperator(null)
        setCurrentPoint('left')
      } else {
        const rightNumber = rightValue.substring(0, rightValue.length - 1) || '0'
        setRightValue(rightNumber)
      }

      setResult('0')
    }
  }

  const handleMaskHide = () => {
    setActive(false)
    if (operator) {
      calculateResult()
    }
  }

  return (
    <View className='jz-calculator__main'>
      {/* 蒙板 */}
      <View className='jz-calculator__mask' onClick={handleMaskHide}></View>

      {/* 主体内容 */}
      <View className='jz-calculator__bottom'>

        {/* 计算过程 */}
        <View className='jz-calculator__process'>{display}</View>

        <View className='calculator-keys__collect'>
          {/* 顶部功能按钮 */}
          <View className='calculator-keys__top'>
            <View className='normal-item__key' onClick={cleanInput}>AC</View>
            <View className='normal-item__key' onClick={() => handleOperatorInput('*')}>*</View>
            <View className='normal-item__key' onClick={() => handleOperatorInput('/')}>/</View>
            <View className='normal-item__key' onClick={handleBackspace}>退格</View>
          </View>

          <View className='d-flex'>
            {/* 左侧结构 */}
            <View className='calculator-keys__left'>
              <View className='d-flex flex-1'>
                <View className='normal-item__key' onClick={() => handleDigitInput('1')}>1</View>
                <View className='normal-item__key' onClick={() => handleDigitInput('2')}>2</View>
                <View className='normal-item__key' onClick={() => handleDigitInput('3')}>3</View>
              </View>

              <View className='d-flex flex-1'>
                <View className='normal-item__key' onClick={() => handleDigitInput('4')}>4</View>
                <View className='normal-item__key' onClick={() => handleDigitInput('5')}>5</View>
                <View className='normal-item__key' onClick={() => handleDigitInput('6')}>6</View>
              </View>

              <View className='d-flex flex-1'>
                <View className='normal-item__key' onClick={() => handleDigitInput('7')}>7</View>
                <View className='normal-item__key' onClick={() => handleDigitInput('8')}>8</View>
                <View className='normal-item__key' onClick={() => handleDigitInput('9')}>9</View>
              </View>

              <View className='d-flex flex-1'>
                <View className='double-width__normal-item' onClick={() => handleDigitInput('0')}>0</View>
                <View className='normal-item__key' onClick={() => handleDigitInput('.')}>.</View>
              </View>
            </View>

            {/* 右侧结构 */}
            <View className='calculator-keys__right'>
              <View className='normal-item__key' onClick={() => handleOperatorInput('-')}>-</View>
              <View className='normal-item__key' onClick={() => handleOperatorInput('+')}>+</View>
              <View className='double-height__normal-item' onClick={() => calculateResult()}>确定</View>
            </View>
          </View>

        </View>
      </View>
    </View>
  )
}