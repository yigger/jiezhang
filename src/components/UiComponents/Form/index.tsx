import React, { useState } from 'react'
import { View, Input as VInput, Textarea as VTextarea } from '@tarojs/components'
import Select from '@/components/Select'

export const Input = function ({
  data,
  setData,
  title='名称',
  placeholder='输入描述',
  showTitle=true,
}) {

  return (
    <View className='jz-common-component__input'>
      { showTitle && <View className='label fs-14 col-text-mute'>{ title }</View> }
      <View>
        <VInput
          className='m-2'
          type='text'
          placeholder={placeholder}
          value={data}
          onInput={({detail}) => setData(detail.value)}
        >
        </VInput>
      </View>
    </View>
  )
}

export const Textarea = function ({
  data,
  setData,
  title='名称',
  placeholder='输入描述',
  showTitle=true,
}) {

  return (
    <View className='jz-common-component__textarea'>
      { showTitle && <View className='label fs-14 col-text-mute'>{ title }</View> }
      <View className='d-flex'>
        <VTextarea
          className='m-2 flex-1'
          placeholder={placeholder}
          value={data}
          onInput={({detail}) => setData(detail.value)}
        >
        </VTextarea>
      </View>
    </View>
  )
}


export const SelectInput = function ({
  list,
  keyName,
  setSelected,
  selected=null,
  title='名称',
  showTitle=true,
}) {
  const [selectOpen, setSelectOpen] = useState(false)

  const handleToggle = () => {
    setSelectOpen(!selectOpen)
  }

  const onSelectedItem = (data) => {
    setSelected(data)
  }

  const onSubmit = () => {
    // 初始化无选择 Select 时，确定默认用第一项
    if (!selected) {
      setSelected(list[0])
    } 
    handleToggle()
  }

  return (
    <View className='jz-common-component__textarea'>
      { showTitle && <View className='label fs-14 col-text-mute'>{ title }</View> }
      <View className='virtual-input d-flex flex-between' onClick={() => handleToggle()}>
        <View>{ selected ? selected[keyName] : '未选择' }</View>
        <View className='iconfont fs-24 jcon-arrow-down'></View>
      </View>

      <Select
        title='账簿类型选择'
        permitCloseMask={false}
        open={selectOpen}
        onToggle={handleToggle}
        onSubmit={() => onSubmit()}
      >
        <View>
          {
            list?.map((item) => {
              return (
                <View
                  className={`select-item d-flex flex-between p-2 ${item['name'] === (selected || list[0])[keyName] ? 'active' : ''}`}
                  onClick={() => onSelectedItem(item)}
                >
                  <View>{item['name']}</View>
                  {
                    item['name'] === (selected || list[0])[keyName] && <View className="iconfont fs-24 jcon-seleted" style="color: #28bb56"></View> 
                  }
                </View>
              )
            })
          }
        </View>
      </Select>
    </View>
  )
}