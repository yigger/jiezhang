import React, { useMemo } from 'react'
import { View, Text } from '@tarojs/components'

const COLORS = [
  '#f56a00', '#7265e6', '#ffbf00', '#00a2ae',
  '#1890ff', '#52c41a', '#722ed1', '#eb2f96',
  '#faad14', '#13c2c2', '#fa541c', '#a0d911'
]

export default function Avatar({ text, size = 34, backgroundColor }) {
  const getInitials = (text) => {
    if (!text) return '?'
    return text.charAt(0).toUpperCase()
  }

  const generateColor = useMemo(() => {
    if (backgroundColor) return backgroundColor
    if (!text) return COLORS[0]
    // 使用字符串的 charCode 之和作为随机种子
    const total = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return COLORS[total % COLORS.length]
  }, [text, backgroundColor])

  return (
    <View
      className='avatar-component'
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: generateColor,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: `${size / 2}px`
      }}
    >
      <Text>{getInitials(text)}</Text>
    </View>
  )
}