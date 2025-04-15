import Taro from '@tarojs/taro'
import React, { useState } from 'react'
import { forwardRef, useImperativeHandle } from 'react'
import { View, Image } from '@tarojs/components'
import jz from '@/jz'
import SlideSetting from '@/components/SlideSetting'


const AssetList = (props, ref) => {
  const [category, setCategory] = useState({name: '', icon_path: null})
  const [editOpen, setEditOpen] = useState(false)
  const [editType, setEditType] = useState({})

  useImperativeHandle(ref, () => ({
    addPrentCategory
  }))

  const removeItem = async (parentTarget, childTarget) => {
    if (childTarget) {
      await jz.confirm('注：移除后无法恢复', '移除资产')
      const targetParentCategories = props.assets.find((item) => item.name === parentTarget.name && item.icon_path === parentTarget.icon_path)
      if (targetParentCategories) {
        const childs = targetParentCategories['childs'].filter((item) => !(item.name === childTarget.name && item.icon_path === childTarget.icon_path))
        targetParentCategories['childs'] = childs

        const newCategories = props.assets.map((obj) => {
          if (obj.name === parentTarget.name && obj.icon_path === parentTarget.icon_path) {
            return targetParentCategories
          } else {
            return obj
          }
        })
        let dup = {...props.assets}
        dup = newCategories
        props.setAssets(dup)
      }

    } else {
      await jz.confirm('移除父资产，底下子资产也会一并移除', '移除父资产')
      const newCategories = props.assets.filter((item) => !(item.name === parentTarget.name && item.icon_path === parentTarget.icon_path))

      let dup = {...props.assets}
      dup = newCategories
      props.setAssets(dup)
    }
    return false
  }

  const addPrentCategory = () => {
    setCategory({name: '', icon_path: null})
    setEditOpen(true)
    setEditType({type: 'add_parent'})
  }

  const addChildType = (parent) => {
    setCategory({name: '', icon_path: null})
    setEditType({type: 'add_child', parent: parent})
    setEditOpen(true)
  }

  const editItem = (category, parent=null) => {
    setEditOpen(true)
    setEditType({type: 'edit_category', category: category, parent: parent})
    setCategory(category)
  }

  const onChangeItem = (data) => {
    if (data['name'] === '') {
      jz.toastError("资产名称不能为空")
      return 
    }

    if (editType['type'] === 'add_parent') {
      // 增加父资产
      Taro.pageScrollTo({
        scrollTop: 99999, // 滚动到容器底部
        duration: 500, // 滚动动画时长,单位 ms
      })
      data['childs'] = []
      data['type'] = 'deposit'

      if (props.assets.find((c) => c.name === data.name)) {
        jz.toastError("已存在同名资产，请换个名称")
        return false
      }
      const dup = [...props.assets]
      dup.push(data)
      props.setAssets(dup)
    } else if (editType['type'] === 'add_child') {
      // 父资产下增加新的子资产
      const parent = editType['parent']
      const targetParent = props.assets.find((item) => item.name === parent.name && item.icon_path === parent.icon_path)
      if (targetParent) {
        // 如果是在父资产下增加子资产，直接追加就好
        if (targetParent['childs'].find((c) => c.name === data.name)) {
          jz.toastError("已存在同名资产，请换个名称")
          return false
        }

        targetParent['childs'].push(data)
        const res = props.assets.map((obj) => {
          if (obj.name === targetParent.name && obj.icon_path === targetParent.icon_path) {
            return targetParent
          } else {
            return obj
          }
        })
        props.setAssets(res)
      }
    } else if (editType['type'] === 'edit_category') {
      // 修改节点，先需要找到目标资产，然后修改它的值，在此之前需要先判断是修改父节点还是子节点
      const targetCategory = editType['category']
      if (editType['parent']) {
        const parent = editType['parent']
        let targetParent = props.assets.find((item) => item.name === parent.name && item.icon_path === parent.icon_path)

        if (targetParent['childs'].find((c) => c.name === data.name)) {
          jz.toastError("已存在同名资产，请换个名称")
          return false
        }
        
        // 修改的是子元素
        targetParent['childs'] = targetParent['childs'].map((item) => {
          if (item.name === targetCategory.name && item.icon_path === targetCategory.icon_path) {
            return data
          } else {
            return item
          }
        })
        const res = props.assets.map((obj) => {
          if (obj.name === targetParent.name && obj.icon_path === targetParent.icon_path) {
            return targetParent
          } else {
            return obj
          }
        })
        props.setAssets(res)
      } else {
        if (props.assets.find((c) => c.name === data.name)) {
          jz.toastError("已存在同名资产，请换个名称")
          return false
        }

        // 修改的父资产
        const res = props.assets.map((item) => {
          if (item.name === targetCategory.name && item.icon_path === targetCategory.icon_path) {
            item = {...item, ...data}
          }
          return item
        })
        props.setAssets(res)
      }
    }

    setCategory({name: '', icon_path: null})
    setEditOpen(false)
  }

  return (
    <View className='category-list__component'>
      <View className='list'>
        { 
          props.assets?.map((parentItem) => {
            return (
              <>
                <View className='parent-category d-flex flex-between flex-center mr-2'>
                  <View className='d-flex flex-center flex-1' onClick={() => editItem(parentItem, null)}>
                    <View className='iconfont col-text-mute fs-32 jcon-arrow-up'></View>
                    <View className='ml-2'>
                      { parentItem?.icon_path && <Image src={`${jz.baseUrl}/${parentItem.icon_path}`}></Image> }
                    </View>
                    <View className='ml-2'>{parentItem.name}</View>
                  </View>
                  <View className='d-flex flex-center fs-14 col-text-mute' onClick={() => removeItem(parentItem, null)}>
                    <View className='iconfont jcon-delete-fill'></View>
                    移除
                  </View>
                </View>
                <>
                  { parentItem['childs'].map((child) => {
                      return (
                        <View className='child-category p-4 d-flex flex-between flex-center'>
                          <View className='d-flex flex-center flex-1' onClick={() => editItem(child, parentItem)}>
                            <View style="margin-left: 32PX;margin-top: 4PX">
                              { child?.icon_path && <Image src={`${jz.baseUrl}/${child.icon_path}`}></Image> }
                            </View>
                            <View className='ml-2'>{child.name}</View>
                          </View>
                          <View className='d-flex flex-center fs-14 col-text-mute'>
                            <View onClick={() => removeItem(parentItem, child)}>
                              <View className='iconfont jcon-delete-fill'></View>
                              移除
                            </View>
                          </View>
                        </View>
                      )
                    }) 
                  }
                </>
                <View className='p-4 d-flex flex-center-center' onClick={() => addChildType(parentItem)}>
                  <View className='iconfont fs-32 jcon-add'></View>
                  新增子账户
                </View>
              </>
            )
          }) 
        }
      </View>

      <SlideSetting
        open={editOpen}
        setEditOpen={setEditOpen}
        category={category}
        onSubmit={onChangeItem}
      ></SlideSetting>
    </View>
  )
}

export default React.memo(forwardRef(AssetList))