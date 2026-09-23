import jz from '@/jz'
import { Input } from '@/src/components/UiComponents'
import type { EditableItem } from '@/src/types/ui'
import { Image, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { guardEvent } from '../../utils/async'

const SlideSetting = ({
  open,
  category,
  onSubmit,
  setEditOpen
}: {
  open: boolean
  category: EditableItem
  onSubmit: (item: EditableItem) => void
  setEditOpen: (open: boolean) => void
}) => {
  const [icons, setIcons] = useState<Record<string, string>[]>([])
  const [selectedIcon, setSelectedIcon] = useState<{ id: string } | null>(null)
  const [showIcon, setShowIcon] = useState(false)
  const [name, setName] = useState('')

  const getIcons = async () => {
    setShowIcon(!showIcon)
    if (icons.length === 0) {
      const res = await jz.api.categories.getCategoryIcon()
      setIcons(res.data)
    }
  }

  useEffect(() => {
    if (category) {
      setSelectedIcon({ id: category?.icon_path })
      setName(category?.name)
    }
  }, [category])

  if (!open) {
    return
  }

  return (
    <View className="edit-category-component">
      <View className="edit-category__mask" onClick={() => undefined}></View>
      <View className="edit-category__main">
        <View className="edit-category__main-title fs-14">
          {category?.name !== '' ? '编辑分类' : '创建分类'}
        </View>
        <View className="edit-category__main-content">
          <View>
            <Input
              title="分类名称"
              placeholder="输入分类名称"
              data={name}
              setData={setName}
            ></Input>
          </View>

          <View
            className="d-flex flex-between flex-center mr-4 mt-4 col-text-mute"
            onClick={guardEvent(() => getIcons())}
          >
            <View className="fs-14" style="margin-left: 12PX">
              分类图标
            </View>
            <View className="d-flex selected-category-icon flex-center">
              {selectedIcon?.id && <Image src={`${jz.baseUrl}${selectedIcon?.id}`}></Image>}
              <View
                className={`iconfont fs-32 ${showIcon ? 'jcon-arrow-down' : 'jcon-arrow-right'}`}
              ></View>
            </View>
          </View>

          {showIcon && (
            <View className="icon-list m-4">
              {icons.map((icon) => {
                return (
                  <View
                    key={icon.id}
                    className="icon"
                    onClick={() => setSelectedIcon({ id: icon.id })}
                  >
                    <Image
                      className={`${icon.id === selectedIcon?.id ? 'active' : ''}`}
                      src={`${jz.baseUrl}${icon.id}`}
                    ></Image>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        <View className="button-group d-flex flex-between m-6">
          <View
            className="btn cancel-btn flex-1 mr-4 text-align-center"
            onClick={() => {
              setEditOpen(false)
            }}
          >
            取消
          </View>
          <View
            className="btn ok-btn flex-1 ml-4 text-align-center"
            onClick={() => {
              onSubmit({ name: name, icon_path: selectedIcon?.id ?? '' })
            }}
          >
            确认
          </View>
        </View>
      </View>
    </View>
  )
}
export default SlideSetting
