import type * as ApiTypes from '@/api/types'
import iconSelectDefault from '@/assets/images/icon_select_default.png'
import BasePage from '@/components/BasePage'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import { Image, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { AtInput } from 'taro-ui'
import { guardEvent, runTask } from '../../../utils/async'

function IconList({
  showMask = false,
  setShowMask,
  handleSelect,
  iconList
}: {
  showMask?: boolean
  setShowMask: (show: boolean) => void
  handleSelect: (icon: Record<string, string>) => void
  iconList: Record<string, string>[]
}) {
  if (!showMask) {
    return null
  }

  return (
    <View className="jz-mask__main">
      <View className="jz-mask" onClick={() => setShowMask(!showMask)}></View>
      <View className="jz-mask__body">
        <View className="icon-list__body">
          {iconList.map((icon: Record<string, string>) => {
            return (
              <View
                key={icon.url}
                className="jz-image-icon d-iblock m-4"
                onClick={() => {
                  setShowMask(!showMask)
                  handleSelect(icon)
                }}
              >
                <Image src={icon.url}></Image>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

export default function EditCategory() {
  const params = jz.router.getParams()
  const [category, setCategory] = useState<ApiTypes.CategoryShowResponse>({
    id: 0,
    name: '',
    parent_id: Number(params.parentId) || 0,
    type: params.type ?? 'expend',
    parent_name: '',
    icon_path: '',
    icon_url: '',
    order: 0
  })

  const [showIconList, setShowIconList] = useState(false)
  const [iconList, setIconList] = useState<Record<string, string>[]>([])
  useEffect(() => {
    if (params.id ?? '') {
      runTask(
        jz.api.categories.getCategoryDetail(params.id ?? '').then((res) => {
          setCategory(res.data)
        })
      )
    }

    runTask(
      jz.api.categories.getCategoryIcon().then((res) => {
        setIconList(res.data)
      })
    )

    runTask(
      jz.api.categories.getSettingList({ type: params.type }).then((res) => {
        const data = res.data.categories.find((item) => item.id === Number(params.parentId))
        if (data) {
          setCategory((prev) => ({ ...prev, parent_name: data.name }))
        }
      })
    )
  }, [params.id, params.parentId, params.type])

  const handleSubmit = async () => {
    const data = {
      type: category.type,
      name: category.name,
      parent_id: category.parent_id,
      icon_path: category.icon_path
    }

    let st
    if (category.id) {
      st = await jz.api.categories.updateCategory(category.id, { category: data })
    } else {
      st = await jz.api.categories.create({ category: { ...data, type: category.type } })
    }

    if (st.data.status === 200) {
      jz.router.navigateBack()
    } else {
      jz.toastError(st.data.msg || '保存失败')
    }
  }

  function handleIconSelect(icon: Record<string, string>) {
    const newIcon = { icon_url: icon.url, icon_path: icon.id }
    setCategory({ ...category, ...newIcon })
  }

  return (
    <BasePage
      headerName={
        category.id === 0
          ? `新增${category.type === 'income' ? '收入' : '支出'}分类`
          : `修改${category.type === 'income' ? '收入' : '支出'}分类`
      }
    >
      {category.id === 0 && category.parent_id > 0 && (
        <View className="p-2">在【{category.parent_name}】下创建子分类</View>
      )}
      <View className="category-form-page">
        <View>
          <View className="d-flex flex-between">
            <View className="flex-1">
              <AtInput
                name="category-name"
                className="p-4"
                type="text"
                placeholder="输入分类名称"
                value={category.name}
                onChange={(value) => {
                  setCategory(Object.assign({ ...category, name: String(value) }))
                }}
              />
            </View>

            <View
              className="category-icon-default-select d-flex flex-center-center"
              onClick={() => setShowIconList(!showIconList)}
            >
              <View className="jz-image-icon">
                <Image src={category.icon_url || iconSelectDefault}></Image>
              </View>
            </View>
          </View>
        </View>

        <Button title="保存" onClick={guardEvent(handleSubmit)} />

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
