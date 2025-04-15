import { Component, useEffect, useState, useContext } from 'react'
import { View, Image } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import BasePage from '@/components/BasePage'
import { Button } from '@/src/components/UiComponents'
import jz from '@/jz'
import Avatar from '@/components/Avatar'

export default function CategorySetting () {
  const params = jz.router.getParams()
  const [listData, setListData] = useState([])
  const [type, _] = useState(params.type || 'expend')
  const [headerData, setHeaderData] = useState({
    all: '0.00',
    year: '0.00',
    month: '0.00',
    parent_name: ''
  })

  // 设置 parentId，首次仅展示父任务
  let parentId = 0
  if (params && params.id) {
    parentId = params.id
  }

  // 获取列表
  const getCategories = async () => {
    const { data } = await jz.withLoading(jz.api.categories.getSettingList({ type: type, parent_id: parentId }))
    jz.storage.delStatementCategories()
    setHeaderData(data.header)
    setListData(data.categories)
  }

  useEffect(() => {
    getCategories()
  }, [type, parentId])
  
  // 因为 useEffect 无法在每次页面渲染的时候重新请求 API，所以只能是用 useDidShow 的方式来达到 “创建分类后重新刷新列表”
  useDidShow(() => {
    getCategories()
  })

  const handleDel = async (categoryId) => {
    await jz.confirm(`是否删除【${headerData.parent_name}】？删除后子分类也删除，数据无法恢复，谨慎操作！`)
    const res = await jz.api.categories.deleteCategory(categoryId)
    if (res.data && res.data.status === 200) {
      const deleteIndex = listData.findIndex((item) => item.id === categoryId)
      if (deleteIndex !== -1) {
        const data = [...listData]
        data.splice(deleteIndex, 1)
        setListData(data)
      }
      jz.router.navigateBack()
    }
  }

  return (
    <BasePage
      headerName={`${headerData.parent_name || '账单分类管理'}`}
    >
      <View className='category-manager'>
        <View className='p-4 header'>
          <View className='mb-4'>
            <View className='fs-12'>本月{ type === 'expend' ? '支出' : '收入' }</View>
            <View className='fs-26'>{headerData.month}</View>
          </View>

          <View className='d-flex flex-between fs-16'>
            <View>本年{ type === 'expend' ? '支出' : '收入' } {headerData.year}</View>
            <View>全年{ type === 'expend' ? '支出' : '收入' } {headerData.all}</View>
          </View>
        </View>

        <View className='jz-pages__settings-categories bg-color-white'>
          {listData.map((item) => (
            <View className='d-flex flex-between flex-center jz-border-bottom-1 p-2 w-100' onClick={() => {
              if (item.parent_id === 0) {
                jz.router.navigateTo({ url: `/pages/setting/category/index?id=${item.id}&type=${item.type}` })
              } else {
                jz.router.navigateTo({ url: `/pages/setting/chart/category_statement?category_id=${item.id}&type=${item.type}` })
              }
            }}>
              <View className='d-flex flex-1 flex-between flex-center'>
                <View className='d-flex flex-center'>
                  <View className='jz-image-icon'>
                    {item.icon_url ? (
                      <Image src={item.icon_url} className='asset-icon' />
                    ) : (
                      <Avatar 
                        text={item.name} 
                        backgroundColor='#1890ff'
                        size={30}
                      />
                    )}
                  </View>
                  <View className='pl-2'>{item.name}</View>
                </View>
                <View className={`fs-18 col-${item.type}`}>{item.amount}</View>
              </View>
            </View>
          ))}

          {parentId > 0 && listData.length === 0 
            && <View className='d-flex col-text-mute flex-center-center'>
                Tips: 当前分类下还没添加子分类，请点击进行创建
              </View>}
        </View>
        
        <Button 
          title='添加分类'
          onClick={() => {
            jz.router.navigateTo({ url: `/pages/setting/category/form?type=${type}&parentId=${parentId}` })
          }}
        />

        {
          parentId > 0 && (
            <View>
              <Button 
                title='编辑'
                onClick={() => {
                  jz.router.navigateTo({ url: `/pages/setting/category/form?type=${type}&id=${parentId}` })
                }}
              />

              <Button 
                title='删除'
                danger
                onClick={() => handleDel(parentId)}
              />
            </View>
          )
        }
      </View>
    </BasePage>
  )
}