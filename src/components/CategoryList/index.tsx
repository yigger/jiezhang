import Taro from '@tarojs/taro'
import React, { useEffect, useState } from 'react'
import { forwardRef, useImperativeHandle } from 'react'
import { View, Image, Text } from '@tarojs/components'
import jz from '@/jz'
import SlideSetting from '@/components/SlideSetting'


const CategoryList = (props, ref) => {
  const [category, setCategory] = useState({name: '', icon_path: null})
  const [editOpen, setEditOpen] = useState(false)
  const [editType, setEditType] = useState({})
  const [categoryType, setCategoryType] = useState('expend')

  useImperativeHandle(ref, () => ({
    addPrentCategory
  }))

  const removeCategory = async (parentTarget, childTarget) => {
    if (childTarget) {
      await jz.confirm('注：移除后无法恢复', '移除分类')
      const targetParentCategories = props.categories[categoryType].find((category) => category.name === parentTarget.name && category.icon_path === parentTarget.icon_path)
      if (targetParentCategories) {
        const childs = targetParentCategories['childs'].filter((item) => !(item.name === childTarget.name && item.icon_path === childTarget.icon_path))
        targetParentCategories['childs'] = childs

        const newCategories = props.categories[categoryType].map((obj) => {
          if (obj.name === parentTarget.name && obj.icon_path === parentTarget.icon_path) {
            return targetParentCategories
          } else {
            return obj
          }
        })
        const dup = {...props.categories}
        dup[categoryType] = newCategories
        props.setCategories(dup)
      }

    } else {
      await jz.confirm('移除父分类，底下子分类也会一并移除', '移除父分类')
      const newCategories = props.categories[categoryType].filter((category) => !(category.name === parentTarget.name && category.icon_path === parentTarget.icon_path))

      const dup = {...props.categories}
      dup[categoryType] = newCategories
      props.setCategories(dup)
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

  const editCategory = (category, parent=null) => {
    setEditOpen(true)
    setEditType({type: 'edit_category', category: category, parent: parent})
    setCategory(category)
  }

  const onSelectCategory = (data) => {
    if (data['name'] === '') {
      jz.toastError("分类名称不能为空")
      return 
    }

    if (editType['type'] === 'add_parent') {
      // 增加父分类
      Taro.pageScrollTo({
        scrollTop: 99999, // 滚动到容器底部
        duration: 500, // 滚动动画时长,单位 ms
      })
      data['childs'] = []
      if (props.categories[categoryType].find((c) => c.name === data.name)) {
        jz.toastError("已存在同名分类，请换个名称")
        return false
      }
      const dup = {...props.categories}
      dup[categoryType].push(data)
      props.setCategories(dup)
    } else if (editType['type'] === 'add_child') {
      // 父分类下增加新的子分类
      const parent = editType['parent']
      const targetParent = props.categories[categoryType].find((item) => item.name === parent.name && item.icon_path === parent.icon_path)
      if (targetParent) {
        // 如果是在父分类下增加子分类，直接追加就好
        if (targetParent['childs'].find((c) => c.name === data.name)) {
          jz.toastError("已存在同名分类，请换个名称")
          return false
        }

        targetParent['childs'].push(data)
        const res = props.categories[categoryType].map((obj) => {
          if (obj.name === targetParent.name && obj.icon_path === targetParent.icon_path) {
            return targetParent
          } else {
            return obj
          }
        })
        const dup = {...props.categories}
        dup[categoryType] = res
        props.setCategories(dup)
      }
    } else if (editType['type'] === 'edit_category') {
      // 修改节点，先需要找到目标分类，然后修改它的值，在此之前需要先判断是修改父节点还是子节点
      const targetCategory = editType['category']
      if (editType['parent']) {
        const parent = editType['parent']
        let targetParent = props.categories[categoryType].find((item) => item.name === parent.name && item.icon_path === parent.icon_path)

        if (targetParent['childs'].find((c) => c.name === data.name)) {
          jz.toastError("已存在同名分类，请换个名称")
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
        const res = props.categories[categoryType].map((obj) => {
          if (obj.name === targetParent.name && obj.icon_path === targetParent.icon_path) {
            return targetParent
          } else {
            return obj
          }
        })
        const dup = {...props.categories}
        dup[categoryType] = res
        props.setCategories(dup)
      } else {
        if (props.categories[categoryType].find((c) => c.name === data.name)) {
          jz.toastError("已存在同名分类，请换个名称")
          return false
        }

        // 修改的父分类
        const res = props.categories[categoryType].map((item) => {
          if (item.name === targetCategory.name && item.icon_path === targetCategory.icon_path) {
            item = {...item, ...data}
          }
          return item
        })
        const dup = {...props.categories}
        dup[categoryType] = res
        props.setCategories(dup)
      }
    }

    setCategory({name: '', icon_path: null})
    setEditOpen(false)
  }

  return (
    <View className='category-list__component'>
      <View className='tab-checkbox'>
        <View className='checkbox-title flex-1 m-2' onClick={() => setCategoryType('expend')}><Text className={`expend ${categoryType === 'expend' ? 'active' : ''}`}>支出</Text></View>
        <View className='checkbox-title flex-1 m-2' onClick={() => setCategoryType('income')}><Text className={`income ${categoryType === 'income' ? 'active' : ''}`}>收入</Text></View>
      </View>
      <View className='list'>
        { 
          props.categories[categoryType]?.map((parentCategory) => {
            return (
              <>
                <View className='parent-category d-flex flex-between flex-center mr-2'>
                  <View className='d-flex flex-center flex-1' onClick={() => editCategory(parentCategory, null)}>
                    <View className='iconfont col-text-mute fs-32 jcon-arrow-up'></View>
                    <View className='ml-2'>
                      { parentCategory?.icon_path && <Image src={`${jz.baseUrl}/${parentCategory.icon_path}`}></Image> }
                    </View>
                    <View className='ml-2'>{parentCategory.name}</View>
                  </View>
                  <View className='d-flex flex-center fs-14 col-text-mute' onClick={() => removeCategory(parentCategory, null)}>
                    <View className='iconfont jcon-delete-fill'></View>
                    移除
                  </View>
                </View>
                <>
                  { parentCategory['childs'].map((child) => {
                      return (
                        <View className='child-category p-4 d-flex flex-between flex-center'>
                          <View className='d-flex flex-center flex-1' onClick={() => editCategory(child, parentCategory)}>
                            <View style="margin-left: 32PX;margin-top: 4PX">
                              { child?.icon_path && <Image src={`${jz.baseUrl}/${child.icon_path}`}></Image> }
                            </View>
                            <View className='ml-2'>{child.name}</View>
                          </View>
                          <View className='d-flex flex-center fs-14 col-text-mute'>
                            <View onClick={() => removeCategory(parentCategory, child)}>
                              <View className='iconfont jcon-delete-fill'></View>
                              移除
                            </View>
                          </View>
                        </View>
                      )
                    }) 
                  }
                </>
                <View className='p-4 d-flex flex-center-center' onClick={() => addChildType(parentCategory)}>
                  <View className='iconfont fs-32 jcon-add'></View>
                  新增子分类
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
        onSubmit={onSelectCategory}
      ></SlideSetting>
    </View>
  )
}

export default React.memo(forwardRef(CategoryList))