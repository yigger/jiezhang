import { useEffect, useState } from 'react'
import { View, Image } from '@tarojs/components'
import BasePage from '@/components/BasePage'
import jz from '@/jz'
import { AtInput } from 'taro-ui'
import { Button } from '@/src/components/UiComponents'
import iconSelectDefault from '@/assets/images/icon_select_default.png'

import "taro-ui/dist/style/components/input.scss"

function IconList({
  showMask = false,
  setShowMask,
  handleSelect,
  iconList
}) {
  if (!showMask) {
    return null
  }
  
  return (
    <View className='jz-mask__main'>
      <View className='jz-mask' onClick={() => setShowMask(!showMask)}></View>
      <View className='jz-mask__body'>
        <View className='icon-list__body'>
          {iconList.map((icon) => {
            return (
              <View className='jz-image-icon d-iblock m-4' onClick={() => {
                setShowMask(!showMask)
                handleSelect(icon)
              }}>
                <Image src={icon.url}></Image>
              </View>
            ) 
          })}
        </View>
      </View>
    </View>
  )
}

export default function EditCategory () {
  const params = jz.router.getParams()
  const [category, setCategory] = useState({
    id: 0,
    name: '',
    parent_id: Number.parseInt(params.parentId) || 0,
    type: params.type,
    parent_name: '',
    icon_id: ''
  })
  
  const [showIconList, setShowIconList] = useState(false)
  const [iconList, setIconList] = useState([])
  useEffect(() => {
    if (params.id) {
      jz.api.categories.getCategoryDetail(params.id).then((res) => {
        setCategory(res.data)
      })
    }

    jz.api.categories.getCategoryIcon().then((res) => {
      setIconList(res.data)
    })

    jz.api.categories.getSettingList({ type: params.type }).then((res) => {
      const data = res.data.categories.find((item) => item.id === Number.parseInt(params.parentId))
      if (data) {
        setCategory({...category, parent_name: data.name})
      }
    })
  }, [])

  const handleSubmit = async () => {
    const data = {
      name: category.name,
      parent_id: category.parent_id,
      icon_path: category.icon_id
    }

    let st
    if (category.id) {
      st = await jz.api.categories.updateCategory(category.id, { category: data })
    } else {
      st = await jz.api.categories.create({ category: { ...data, type: category.type }})
    }

    if (st.data.status === 200) {
      jz.router.navigateBack()
    } else {
      jz.toastError(st.data.msg)
    }
  }

  function handleIconSelect(icon) {
    const newIcon = { icon_url: icon.url, icon_id: icon.id }
    setCategory({ ...category, ...newIcon })
  }

  return (
    <BasePage
      headerName={category.id === 0 ? `新增${category.type === 'income' ? '收入' : '支出'}分类` : `修改${category.type === 'income' ? '收入' : '支出'}分类`}
    >
      { category.id === 0 && category.parent_id > 0 && <View className='p-2'>在【{category.parent_name}】下创建子分类</View> }
      <View className='category-form-page'>
        <View>
          <View className='d-flex flex-between'>
            <View className='flex-1'>
              <AtInput
                className='p-4'
                type='text'
                placeholder='输入分类名称'
                value={category.name}
                onChange={(value) => {
                  setCategory(Object.assign({...category, name: value}))
                }}
              />
            </View>
            
            <View className='category-icon-default-select d-flex flex-center-center' onClick={() => setShowIconList(!showIconList)}>
              <View className='jz-image-icon'>
                <Image src={category.icon_url || iconSelectDefault}></Image>
              </View>
            </View>
          </View>
        </View>

        <Button
          title='保存'
          onClick={handleSubmit}
        />

        <IconList
          showMask={showIconList}
          setShowMask={setShowIconList}
          iconList={iconList}
          handleSelect={handleIconSelect}
        ></IconList>
      </View>
    </BasePage>
  )
}