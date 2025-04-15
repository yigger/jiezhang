import { useState } from 'react'
import { AtSwipeAction } from "taro-ui"
import { View, Image, Text } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import BasePage from '@/components/BasePage'
import { Button } from '@/src/components/UiComponents'
import jz from '@/jz'
import Avatar from '@/components/Avatar'

import "taro-ui/dist/style/components/swipe-action.scss"

function List ({
  data,
  handleClick
}) {
  return (
    <View>
      <View className='col-text-mute p-2 text-align-center'>Tips: 左划可以对分类进行编辑和删除哟~</View>
      {data.map((item) => (
        <View>
          <AtSwipeAction
            key={item.id}
            onClick={(text) => handleClick(text, item) }
            options={[
              {
                text: '编辑',
                style: {
                  backgroundColor: '#6190E8'
                }
              },
              {
                text: '删除',
                style: {
                  backgroundColor: '#FF4949'
                }
              }
          ]}>
            <View className='d-flex flex-between flex-center jz-border-bottom-1 p-2 w-100' onClick={() => {
              if (item.parent_id === 0) {
                jz.router.navigateTo({url: `/pages/setting/asset/index?parentId=${item.id}`})
              }
            }}>
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
                <View className='pl-4'>
                  <View>
                    <Text>{item.name}</Text> 
                    <Text className='col-text-mute fs-12'>({item.type == 'deposit' ? '存款账户' : '负债账户'})</Text>
                  </View>
                  <View className={`col-${item.type} fs-12`}>结余 {item.amount}</View> 
                </View>
              </View>
            </View>
          </AtSwipeAction>
        </View>
      ))}
    </View>
  )
}

export default function AssetSetting () {
  const params = jz.router.getParams()
  const [listData, setListData] = useState([])
  const parentId = Number.parseInt(params.parentId) || 0

  // 获取列表
  const getAssets = () => {
    jz.api.assets.getSettingList({ parentId: parentId }).then((res) => {
      jz.storage.delStatementAssets()
      setListData(res.data)
    })
  }

  useDidShow(() => {
    getAssets()
  })

  const handleClick = async (e, assetItem) => {
    if (e.text === '编辑') {
      jz.router.navigateTo({ url: `/pages/setting/asset/form?id=${assetItem.id}` })
    } else if (e.text === '删除') {
      await jz.confirm("是否删除该分类？删父级分类会把子分类也删除，统计数据将丢失，谨慎操作！")
      const res = await jz.api.assets.deleteAsset(assetItem.id)
      if (res.isSuccess && res.data && res.data.status === 200) {
        const deleteIndex = listData.findIndex((item) => item.id === assetItem.id)
        if (deleteIndex !== -1) {
          const data = [...listData]
          data.splice(deleteIndex, 1)
          setListData(data)
        }
      }
    }
  }

  return (
    <BasePage
      headerName='资产管理'
    >
      <List
        data={listData}
        handleClick={handleClick}
      />

      <Button 
        title='新增资产'
        onClick={() => {
          jz.router.navigateTo({ url: `/pages/setting/asset/form?parentId=${parentId}` })
        }}
      />
    </BasePage>
  )
}