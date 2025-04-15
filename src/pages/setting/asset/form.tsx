import { useEffect, useState } from 'react'
import { View, Image } from '@tarojs/components'
import BasePage from '@/components/BasePage'
import jz from '@/jz'
import { Picker, Input } from '@tarojs/components'
import { Button } from '@/src/components/UiComponents'
import { AtInput } from 'taro-ui'
import iconSelectDefault from '@/assets/images/icon_select_default.png'

import "taro-ui/dist/style/components/input.scss"

function IconList({
  showMask = false,
  setShowMask,
  handleSelect
}) {
  const [iconList, setIconList] = useState([])
  useEffect(() => {
    jz.api.assets.getAssetIcon().then((res) => {
      setIconList(res.data)
    })
  }, [])

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

export default function EditAsset () {
  const params = jz.router.getParams()
  const [asset, setAsset] = useState({
    id: 0,
    name: '',
    amount: 0,
    type: 'deposit',
    parent_id: Number.parseInt(params.parentId) || 0,
    icon_id: 0
  })
  const [showIconList, setShowIconList] = useState(false)
  const [parentAsset, setParentAsset] = useState(null)
  const assetTypes = ['存款账户', '负债账户']

  useEffect(() => {
    // 编辑
    if (params.id) {
      jz.api.assets.getAssetDetail(params.id).then((res) => {
        setAsset(res.data)
      })
    }

    if (params.parentId > 0) {
      jz.api.assets.getAssetDetail(params.parentId).then((res) => {
        setParentAsset(res.data)
        setAsset({...asset, type: res.data.type})
      })
    }
  }, [])

  const handleSubmit = async () => {
    if (asset.id === 0) {
      const st = await jz.api.assets.create(asset)
      if (st.data.status === 200) {
        jz.router.navigateBack()
      } else {
        jz.toastError(st.data.msg)
      }
    } else {
      const st = await jz.api.assets.updateAsset(asset.id, asset)
      if (st.data.status === 200) {
        jz.router.navigateBack()
      } else {
        jz.toastError(st.data.msg)
      }
    }
  }

  const changeAsset = ({ detail }) => {
    const newType = Number.parseInt(detail.value) === 0 ? 'deposit' : 'debt'
    setAsset(Object.assign({... asset, type: newType}))
  }

  const handleIconSelect = (icon) => {
    const newIcon = { icon_url: icon.url, icon_id: icon.id, icon_path: icon.id }
    setAsset({ ...asset, ...newIcon })
  }

  return (
    <BasePage
      headerName={asset.id === 0 ? '新增资产' : '编辑资产'}
    >
      { parentAsset && <View className='col-text-mute p-4'>在 【{parentAsset.name}】 下创建子分类</View> }
      <View>

        <View>
          <View className='d-flex flex-between bg-color-white'>
            <View className='flex-1'>
              <AtInput
                className='p-4'
                type='text'
                placeholder='输入资产名称'
                value={asset.name}
                maxlength={10}
                onChange={(value) => {
                  setAsset(Object.assign({...asset, name: value}))
                }}
              />
            </View>
            
            <View className='category-icon-default-select d-flex flex-center-center bg-color-white' onClick={() => setShowIconList(!showIconList)}>
              <View className='jz-image-icon'>
                <Image src={asset.icon_url || iconSelectDefault}></Image>
              </View>
            </View>
          </View>
        </View>

        {<View className='d-flex p-4 flex-between jz-border-bottom-1 bg-color-white'>
          <View>资产结余</View>
          <Input
            className="text-align-right"
            type="digit"
            placeholder='输入资产余额'
            maxlength={20}
            value={asset.amount}
            onInput={({ detail }) => setAsset({...asset, amount: detail.value}) }
          ></Input>
        </View>}
        
        <Picker mode='selector' range={assetTypes} onChange={changeAsset}>
          <View className='d-flex p-4 flex-between jz-border-bottom-1 bg-color-white'>
            <View>资产类型</View>
            <View>{asset.type === 'deposit' ? '存款账户' : '负债账户'}</View>
          </View>
        </Picker>
        <View className='fs-14 p-2 col-text-mute'>
          <View>说明：系统借助此选项来计算净资产和负债情况</View>
          <View>- 存款账户：适用于如银行卡、支付宝、微信等现有资产</View>
          <View>- 负债账户：适用于信用卡、花呗等负债资产</View>
        </View>

        <Button
          title='保存'
          onClick={handleSubmit}
        />

        <IconList
          showMask={showIconList}
          setShowMask={setShowIconList}
          handleSelect={handleIconSelect}
        ></IconList>
      </View>
    </BasePage>
  )
}