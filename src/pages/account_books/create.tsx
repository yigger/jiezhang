import Taro from '@tarojs/taro'
import React, { useEffect, useState, useRef } from 'react'
import { View } from '@tarojs/components'
import BasePage from '@/components/BasePage'
import CategoryList from '@/components/CategoryList'
import AssetList from '@/components/AssetList'
import jz from '@/jz'
import { Input, Button, Textarea, SelectInput } from '@/src/components/UiComponents'
import { AtSteps } from 'taro-ui'

import './create.styl'

const CreateView = ({
  name,
  setName,
  accountType,
  setAccountType,
  desc,
  setDesc
}) => {
  const [types, setTypes] = useState([])
  const getTypes = async () => {
    Taro.showLoading()
    const { data } = await jz.api.account_books.getAccountBookTypes()
    Taro.hideLoading()
    if (data.data) {
      setTypes(data.data)
    }
  }

  useEffect(() => {
    getTypes()
  }, [])

  return (
    <View>
      <View>
        <Input
          title='账簿名称'
          placeholder='请输入账簿名称'
          data={name}
          setData={setName}
        ></Input>
      </View>

      <View>
        <View>
          <SelectInput
            title='账簿类型'
            keyName="name"
            setSelected={setAccountType}
            selected={accountType}
            list={types}
          ></SelectInput>
        </View>
      </View>

      <View>
        <Textarea
          title='描述'
          placeholder='请输入描述...'
          data={desc}
          setData={setDesc}
        ></Textarea>
      </View>
    </View>
  )
}

const steps = [
  { 'title': '基础信息' },
  { 'title': '分类设置' },
  { 'title': '资产设置' }
]

export default function CreateAccountBook() {
  const [currentStep, setCurrentStep] = useState(0)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [accountType, setAccountType] = useState(null)

  const [categories, setCategories] = useState([])
  const [assets, setAssets] = useState([])
  const categoryRef = useRef(null)
  const assetRef = useRef(null)

  const getCategories = async () => {
    Taro.showLoading({
      title: 'loading',
    })
    const {data} = await jz.api.account_books.getCategoriesList({ accountType: accountType['id'] })
    Taro.hideLoading()
    setCategories(data.data.categories)
    setAssets(data.data.assets)
  }

  const onPrev = () => {
    setCurrentStep(currentStep-1)
  }
  
  const onNext = () => {
    if (currentStep === 0) {
      if (name === '') {
        jz.toastError('账簿名称不能为空哦~')
        return false
      }

      if (!accountType) {
        jz.toastError('请选择账簿类型~')
        return false
      }
    }

    if (currentStep+1 === 1 && categories.length === 0) {
      getCategories()
    } 

    if (currentStep === 2) {
      submit()
    }

    setCurrentStep(currentStep+1 >= steps.length ? currentStep : currentStep+1)
    return false
  }

  const createParentCategory = () => {
    if (currentStep === 1) {
      categoryRef.current.addPrentCategory()
    } else if (currentStep === 2) {
      assetRef.current.addPrentCategory()
    }
  }

  const submit = async () => {
    const params = {
      name: name,
      description: desc,
      account_type: accountType['id'],
      categories: categories,
      assets: assets
    }

    if (name === "") {
      jz.toastError("名称不能为空")
      return false
    }
    Taro.showLoading({title: '创建中...'})
    const { data } = await jz.api.account_books.create(params)
    Taro.hideLoading()
    if (data.status !== 200) {
      jz.toastError(data.msg)
      return false
    } else {
      try {
        await jz.confirm("创建成功，切换到新账簿吗？")
        await jz.api.account_books.updateDefaultAccount(data.data)
      } catch (ex) {}
      jz.router.redirectTo({url: "/pages/home/index" })
    }
  }

  return (
    <BasePage
      headerName='创建新账簿'
    >
      <View className='create-account-book__page'>
        <View className='steps bg-color-white p-4'>
          <AtSteps
            items={steps}
            current={currentStep}
          />
        </View>

        <View>
          {currentStep === 0 && 
            <CreateView
              name={name}
              setName={setName}
              desc={desc}
              setDesc={setDesc}
              accountType={accountType}
              setAccountType={setAccountType}
            ></CreateView>
          }
          {
            currentStep === 1 && 
              <CategoryList
                ref={categoryRef}
                categories={categories}
                setCategories={setCategories}
              ></CategoryList>
          }
          {
            currentStep === 2 && 
              <AssetList
                ref={assetRef}
                assets={assets}
                setAssets={setAssets}
              ></AssetList>
          }
        </View>

        <View className='btn-group d-flex bg-color-fbfbfb flex-between flex-center w-100'>
          { currentStep != 0 ? <Button title='上一步' onClick={() => onPrev()}></Button> : <View></View> }
          { currentStep != 0 && 
              <View className='p-4 d-flex flex-center-center' onClick={() => createParentCategory() }>
                <View className='iconfont fs-32 jcon-add'></View>
                创建父分类
              </View>
          }
          <Button title={`${currentStep !== 2 ? '下一步' : '提  交'}`} onClick={() => onNext()}></Button>
        </View>
      </View>
    </BasePage>
  )
}

