
import React from 'react'
import { ScrollView, View } from '@tarojs/components'

export const Tabs = ({
  tabs,
  current,
  onChange
}) => {
  return (
    <ScrollView
      scrollX
      className='jz-common-components__tab'
      enhanced
      showScrollbar={false}
    >
      <View className='d-flex'>
        {tabs.map((item) => {
          return (
            <View
              className={`item d-flex flex-center-center p-2 ${item.type} ${current === item.id ? 'active' : ''}`}
              onClick={() => onChange(item.id)}
            >
              {item.title}
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}