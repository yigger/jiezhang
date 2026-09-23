import type * as ApiTypes from '@/api/types'
import iconSelectDefault from '@/assets/images/icon_select_default.png'
import BasePage from '@/components/BasePage'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import { Image, Input, Picker, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { AtInput } from 'taro-ui'
import { guardEvent, runTask } from '../../../utils/async'

function IconList({
  showMask = false,
  setShowMask,
  handleSelect
}: {
  showMask?: boolean
  setShowMask: (show: boolean) => void
  handleSelect: (icon: Record<string, string>) => void
}) {
  const [iconList, setIconList] = useState<Record<string, string>[]>([])
  useEffect(() => {
    runTask(
      jz.api.assets.getAssetIcon().then((res) => {
        setIconList(res.data)
      })
    )
  }, [])

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

export default function EditAsset() {
  const params = jz.router.getParams()
  const [asset, setAsset] = useState<
    Omit<ApiTypes.AssetShowResponse, 'amount'> & { amount: string }
  >({
    id: 0,
    name: '',
    amount: '0',
    type: 'deposit',
    parent_id: Number(params.parentId) || 0,
    icon_path: '',
    icon_url: '',
    remark: '',
    order: 0
  })
  const [showIconList, setShowIconList] = useState(false)
  const [parentAsset, setParentAsset] = useState<ApiTypes.AssetShowResponse | null>(null)
  const assetTypes = ['存款账户', '负债账户']

  useEffect(() => {
    // 编辑
    if (params.id ?? '') {
      runTask(
        jz.api.assets.getAssetDetail(params.id ?? '').then((res) => {
          setAsset({ ...res.data, amount: String(res.data.amount) })
        })
      )
    }

    if (Number(params.parentId) > 0) {
      runTask(
        jz.api.assets.getAssetDetail(params.parentId ?? '').then((res) => {
          setParentAsset(res.data)
          setAsset((current) => ({ ...current, type: res.data.type }))
        })
      )
    }
  }, [params.id, params.parentId])

  const handleSubmit = async () => {
    if (asset.id === 0) {
      const st = await jz.api.assets.create(asset)
      if (st.data.status === 200) {
        jz.router.navigateBack()
      } else {
        jz.toastError(st.data.msg || '保存失败')
      }
    } else {
      const st = await jz.api.assets.updateAsset(asset.id, asset)
      if (st.data.status === 200) {
        jz.router.navigateBack()
      } else {
        jz.toastError(st.data.msg || '保存失败')
      }
    }
  }

  const changeAsset = ({ detail }: { detail: { value: string | number } }) => {
    const newType = Number(detail.value) === 0 ? 'deposit' : 'debt'
    setAsset(Object.assign({ ...asset, type: newType }))
  }

  const handleIconSelect = (icon: Record<string, string>) => {
    const newIcon = { icon_url: icon.url, icon_id: icon.id, icon_path: icon.id }
    setAsset({ ...asset, ...newIcon })
  }

  return (
    <BasePage headerName={asset.id === 0 ? '新增资产' : '编辑资产'}>
      {parentAsset && (
        <View className="col-text-mute p-4">在 【{parentAsset.name}】 下创建子分类</View>
      )}
      <View>
        <View>
          <View className="d-flex flex-between bg-color-white">
            <View className="flex-1">
              <AtInput
                name="asset-name"
                className="p-4"
                type="text"
                placeholder="输入资产名称"
                value={asset.name}
                maxlength={10}
                onChange={(value) => {
                  setAsset(Object.assign({ ...asset, name: String(value) }))
                }}
              />
            </View>

            <View
              className="category-icon-default-select d-flex flex-center-center bg-color-white"
              onClick={() => setShowIconList(!showIconList)}
            >
              <View className="jz-image-icon">
                <Image src={asset.icon_url || iconSelectDefault}></Image>
              </View>
            </View>
          </View>
        </View>

        {
          <View className="d-flex p-4 flex-between jz-border-bottom-1 bg-color-white">
            <View>资产结余</View>
            <Input
              className="text-align-right"
              type="digit"
              placeholder="输入资产余额"
              maxlength={20}
              value={asset.amount}
              onInput={({ detail }: { detail: { value: string | number } }) =>
                setAsset({ ...asset, amount: String(detail.value) })
              }
            ></Input>
          </View>
        }

        <Picker mode="selector" range={assetTypes} onChange={changeAsset}>
          <View className="d-flex p-4 flex-between jz-border-bottom-1 bg-color-white">
            <View>资产类型</View>
            <View>{asset.type === 'deposit' ? '存款账户' : '负债账户'}</View>
          </View>
        </Picker>
        <View className="fs-14 p-2 col-text-mute">
          <View>说明：系统借助此选项来计算净资产和负债情况</View>
          <View>- 存款账户：适用于如银行卡、支付宝、微信等现有资产</View>
          <View>- 负债账户：适用于信用卡、花呗等负债资产</View>
        </View>

        <Button title="保存" onClick={guardEvent(handleSubmit)} />

        <IconList
          showMask={showIconList}
          setShowMask={setShowIconList}
          handleSelect={handleIconSelect}
        ></IconList>
      </View>
    </BasePage>
  )
}
