import React from 'react'
import { View } from '@tarojs/components'
import Statement from '../Statement'

export default function Statements({ statements, editable = true }) {
  return (
    <View className='p-2'>
      { statements.map((statement) => <Statement statement={statement} editable={editable}></Statement>) }
    </View>
  )
}