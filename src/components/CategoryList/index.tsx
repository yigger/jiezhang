import SlideSetting from '@/components/SlideSetting'
import jz from '@/jz'
import type { EditableItem, EditableParent, EditState, ListHandle, Setter } from '@/src/types/ui'
import { reportError } from '@/utils/async'
import { editTree, removeTreeItem } from '@/utils/edit-tree'
import { Image, Text, View } from '@tarojs/components'
import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { guardEvent } from '../../utils/async'

const CategoryList = (
  props: {
    categories: Record<string, EditableParent[]>
    setCategories: Setter<Record<string, EditableParent[]>>
  },
  ref: React.ForwardedRef<ListHandle>
) => {
  const [category, setCategory] = useState<EditableItem>({ name: '', icon_path: '' })
  const [editOpen, setEditOpen] = useState(false)
  const [editType, setEditType] = useState<EditState>({ type: 'add_parent' })
  const [categoryType, setCategoryType] = useState('expend')

  useImperativeHandle(ref, () => ({
    addPrentCategory
  }))

  const removeCategory = async (parentTarget: EditableParent, childTarget: EditableItem | null) => {
    await jz.confirm(
      childTarget ? '移除后无法恢复，确认移除？' : '移除父项目会同时移除子项目，确认移除？'
    )
    props.setCategories((current) => ({
      ...current,
      [categoryType]: removeTreeItem(current[categoryType], parentTarget, childTarget)
    }))
  }

  const addPrentCategory = () => {
    setCategory({ name: '', icon_path: '' })
    setEditOpen(true)
    setEditType({ type: 'add_parent' })
  }

  const addChildType = (parent: EditableParent) => {
    setCategory({ name: '', icon_path: '' })
    setEditType({ type: 'add_child', parent: parent })
    setEditOpen(true)
  }

  const editCategory = (category: EditableItem, parent: EditableParent | null = null) => {
    setEditOpen(true)
    setEditType({ type: 'edit_category', category: category, parent: parent })
    setCategory(category)
  }

  const onSelectCategory = (data: EditableItem) => {
    try {
      props.setCategories({
        ...props.categories,
        [categoryType]: editTree(props.categories[categoryType], editType, data)
      })
      setCategory({ name: '', icon_path: '' })
      setEditOpen(false)
    } catch (error) {
      reportError(error)
    }
  }

  return (
    <View className="category-list__component">
      <View className="tab-checkbox">
        <View className="checkbox-title flex-1 m-2" onClick={() => setCategoryType('expend')}>
          <Text className={`expend ${categoryType === 'expend' ? 'active' : ''}`}>支出</Text>
        </View>
        <View className="checkbox-title flex-1 m-2" onClick={() => setCategoryType('income')}>
          <Text className={`income ${categoryType === 'income' ? 'active' : ''}`}>收入</Text>
        </View>
      </View>
      <View className="list">
        {props.categories[categoryType]?.map((parentCategory) => {
          return (
            <>
              <View className="parent-category d-flex flex-between flex-center mr-2">
                <View
                  className="d-flex flex-center flex-1"
                  onClick={() => editCategory(parentCategory, null)}
                >
                  <View className="iconfont col-text-mute fs-32 jcon-arrow-up"></View>
                  <View className="ml-2">
                    {parentCategory?.icon_path && (
                      <Image src={`${jz.baseUrl}/${parentCategory.icon_path}`}></Image>
                    )}
                  </View>
                  <View className="ml-2">{parentCategory.name}</View>
                </View>
                <View
                  className="d-flex flex-center fs-14 col-text-mute"
                  onClick={guardEvent(() => removeCategory(parentCategory, null))}
                >
                  <View className="iconfont jcon-delete-fill"></View>
                  移除
                </View>
              </View>
              <>
                {parentCategory['childs'].map((child) => {
                  return (
                    <View
                      key={child.name}
                      className="child-category p-4 d-flex flex-between flex-center"
                    >
                      <View
                        className="d-flex flex-center flex-1"
                        onClick={() => editCategory(child, parentCategory)}
                      >
                        <View style="margin-left: 32PX;margin-top: 4PX">
                          {child?.icon_path && (
                            <Image src={`${jz.baseUrl}/${child.icon_path}`}></Image>
                          )}
                        </View>
                        <View className="ml-2">{child.name}</View>
                      </View>
                      <View className="d-flex flex-center fs-14 col-text-mute">
                        <View onClick={guardEvent(() => removeCategory(parentCategory, child))}>
                          <View className="iconfont jcon-delete-fill"></View>
                          移除
                        </View>
                      </View>
                    </View>
                  )
                })}
              </>
              <View
                className="p-4 d-flex flex-center-center"
                onClick={() => addChildType(parentCategory)}
              >
                <View className="iconfont fs-32 jcon-add"></View>
                新增子分类
              </View>
            </>
          )
        })}
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
