import React from 'react'
import { View } from '@tarojs/components'
export const Loading = function ({
  active,
  title = '加载中...'
}) {
  if (!active) {
    return null
  }

  return (
    <View className='d-flex flex-center-center flex-column'>
      <View className='jz-common-component__loading'></View>
      <View className='mt-4 col-text-mute'>{title}</View>
    </View>
  )
}