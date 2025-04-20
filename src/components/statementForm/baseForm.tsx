import Taro from "@tarojs/taro"
import React, { useEffect, useState } from 'react'
import { useDidShow } from '@tarojs/taro'
import { View, Picker, Text, Input } from '@tarojs/components'
import { Button } from '@/src/components/UiComponents'
import Calculator from '@/src/components/Calculator'
import CategorySelect from './CategorySelect'
import PayeeSelect from './PayeeSelect'
import jz from '@/jz'
import { AtTextarea, AtImagePicker  }  from 'taro-ui'

const moodTags = [
  { name: '开心', color: '#52c41a' },  // 绿色，积极正面的心情
  { name: '纠结', color: '#1890ff' },  // 蓝色，表示思考和犹豫
  { name: '后悔', color: '#ff4d4f' },  // 红色，表示负面情绪
  { name: '无奈', color: '#faad14' },  // 黄色，表示中性情绪
  { name: '郁闷', color: '#722ed1' },  // 紫色，表示低落的情绪
  { name: '生气', color: '#f5222d' }   // 深红色，表示强烈的负面情绪
]

export default function BaseForm({
  typeName,
  statementType,
  form,
  setForm
}) {
  const [categoryName, setCategoryName] = useState('请选择分类')
  const [assetName, setAssetName] = useState('请选择资产')
  const [payeeTags, setPayeeTags] = useState([])
  const [categorySelectActive, setCategorySelectActive] = useState(false)
  const [assetSelectActive, setAssetSelectActive] = useState(false)
  const [selectLoading, setSelectLoading] = useState(false)
  const [payeeSelectActive, setPayeeSelectActive] = useState(false)
  const [calculatorVisible, setCalculatorVisible] = useState(true)
  const [displayValue, setDisplayValue] = useState('')
  const [calcOperator, setCalcOperator] = useState('')
  const [prevValue, setPrevValue] = useState('')
  const [currentAssetType, setCurrentAssetType] = useState('') 
  const [categoryList, setCategoryList] = useState({
    frequent: [],
    data: []
  })
  const [assetList, setAssetList] = useState({
    frequent: [],
    data: []
  })
  const [categoryFrequent, setCategoryFrequent] = useState([])
  const [assetFrequent, setAssetFrequent] = useState([])
  const [showExtraFields, setShowExtraFields] = useState({
    date: false,
    mood: false,
    uploadPic: false
  })
  const [rowField, setRowField] = useState({
    category: true,
    asset: true,
    transfer_asset: false,
    payment_proxy: false,
    reimburse: false,
    loan_in: false,
    loan_out: false,
  })
  const [targetObjects, settargetObjects] = useState([])

  const updateRowField = (fields) => {
    const rawFields = { ...rowField }
    for (let field in rawFields) {
      if (fields.includes(field)) {
        rawFields[field] = true
      } else {
        rawFields[field] = false
      }
    }
    setRowField(rawFields)
  }

  useEffect(() => {
   jz.api.statements.assetFrequent().then((res) => {
      setAssetFrequent(res.data)
    }) 
  }, [])

  useEffect(() => {
    Taro.showLoading({title: '数据加载中'})
    // 初始化状态栏
    switch (statementType) {
      case 'expend':
      case 'income':
        updateRowField(['category', 'asset'])
        break
      case 'repayment':
      case 'transfer':
        updateRowField(['transfer_asset'])
        break
      default:
        updateRowField(['asset', statementType])
    }

    if(['payment_proxy', 'reimburse', 'loan_in', 'loan_out'].includes(statementType)) {
      jz.api.statements.targetObjects(statementType).then(({ data }) => {
        settargetObjects(data.data)
      })
    }

    if (['income', 'expend'].includes(statementType)) {
      jz.api.statements.categoryFrequent(statementType).then(({ data }) => {
        setCategoryFrequent(data)
      })
    }

    // 初始化默认分类和资产
    jz.api.statements.defaultCategoryAsset(statementType).then(({ data }) => {
      if (data.data) {
        if (['income', 'expend'].includes(statementType)) {
          setAssetName(data.data.asset_name)
          setCategoryName(data.data.category_name)
          setForm({...form, category_id: data.data.category_id, asset_id: data.data.asset_id  })
        } else {
          setAssetName(data.data.asset_name)
          setForm({...form, asset_id: data.data.asset_id })
        }
      } else {
        setCategoryName('请选择分类')
        setAssetName('请选择资产')
        setForm({...form, category_id: 0, asset_id: 0  })
      }
      Taro.hideLoading()
    })
  }, [statementType])

  useDidShow(() => {
    setSelectLoading(true)
    jz.api.payees.list().then((data) => {
      setSelectLoading(false)
      setPayeeTags(data)
    })
  })

  // 选中分类后的 callback
  const handleCategoryItemClick = (e, parent, item) => {
    setCategoryName(`${parent?.name} -> ${item.name}`)
    setForm({ ...form, category_id: item.id })
    setCategorySelectActive(false)
  }

  // 选中资产后的 callback
  const handleAssetItemClick = (e, parent, item) => {
    setAssetName(`${parent?.name} -> ${item.name}`)
    if(['transfer', 'repayment'].includes(statementType)) {
      if (currentAssetType === 'from') {
        setForm({ ...form, from_asset_id: item.id })
      } else {
        setForm({ ...form, to_asset_id: item.id })
      }
    } else {
      setForm({ ...form, asset_id: item.id })
    }
    setAssetSelectActive(false)
  }

  const getCategories = async () => {
    setCategorySelectActive(true)
    setSelectLoading(true)
    const data = await jz.api.statements.categoriesWithForm(statementType)
    if (data) {
      setCategoryList(data)
      setSelectLoading(false)
    }
  }

  const getAssets = async (direction = null) => {
    setAssetSelectActive(true)
    setSelectLoading(true)
    setCurrentAssetType(direction)
    const data = await jz.api.statements.assetsWithForm()
    if (data) {
      setAssetList(data)
      setSelectLoading(false)
    }
  }

  const handlePayeeItemClick = (tag) => {
    setForm({...form, payee_id: tag.id})
    setPayeeSelectActive(false)
  }

  const handleTargetObjectClick = (target) => {
    setForm({...form, target_object: target})
  }

  const findAssetName = (assetId) => {
    if (!assetId) return '请选择资产'
    for (const category of assetList.data) {
      for (const asset of category.childs) {
        if (asset.id === assetId) {
          return `${category.name}->${asset.name}`
        }
      }
    }
    return '请选择资产'
  }
  

  const submit = async ({
    reload = false
  }) => {
    if (form.amount === '0' || form.amount === '') {
      // 请输入账单金额
      jz.toastError("金额还没填呢~")
      return false
    }

    if (form.type === 'transfer' || form.type === 'repayment') {
      if (Number(form.from_asset_id) === Number(form.to_asset_id)) {
        // 转出账户和转入账户不能相同
        jz.toastError("转出账户和转入账户不能相同")
        return false
      }
      if (Number(form.from_asset_id) === 0) {
        // 请输入转出账户
        jz.toastError("转出账户还没选择呢~")
        return false
      }
      if (Number(form.to_asset_id) === 0) {
        // 请输入转入账户
        jz.toastError("转入账户还没选择呢~")
        return false
      }
    } else {
      if (Number(form.asset_id) === 0) {
        // 请输入资产类型
        jz.toastError("资产还没选呢~")
        return false
      }
    }
    
    if (['expend', 'income'].includes(form.type) && Number(form.category_id) === 0) {
      // 请输入分类详情
      jz.toastError("分类还没选择呢~")
      return false
    }

    Taro.showLoading({
      title: 'loading',
    })
    const { data } = await jz.api.statements.create(form)
		Taro.hideLoading()
    if(data.status === 200) {
      jz.event.emit('statement:updated')
      // 上传图片...
      for (let file of form.upload_files) {
        if (file.file) {
          await jz.api.upload(file.url, {
            type: 'statement_upload',
            statement_id: data.data.id
          })
        }
      }
      Taro.hideLoading()
      if (reload) {
        Taro.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1000
        })
        setForm({
          ...form,
          amount: '',
          description: '',
          upload_files: [],
          mood: '',
          payee_id: 0
        })
        // 重置计算器状态
        setDisplayValue('')
        setCalcOperator('')
        setPrevValue('')
        setCalculatorVisible(true)
        // 重置额外字段状态
        setShowExtraFields({
          date: false,
          mood: false,
          uploadPic: false
        })
      } else {
        jz.router.navigateBack()
      }
		} else {
      Taro.hideLoading()
			jz.toastError(data.msg)
		}
  }

  return (
    <View onClick={() => calculatorVisible && setCalculatorVisible(false)}>
      <View>
        <View className='statement-form__expend-form'>
          <View 
            className="statement-form__new-amount-input"
            onClick={(e) => {
              e.stopPropagation()
              setCalculatorVisible(true)
              setDisplayValue('')
              setCalcOperator('')
              setPrevValue('')
            }}
          >
            <View className='amount-wrapper'>
              <Text className={`type-label ${statementType}`}>
                {typeName}
              </Text>
              <View className='amount-content'>
                <Text className={`amount ${statementType}`}>
                  {form.amount || '0.00'}
                </Text>
                {calculatorVisible && (
                  <Text className='calc-process'>
                    {calcOperator ? `${prevValue} ${calcOperator} ${displayValue}` : displayValue}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {calculatorVisible && (
            <View onClick={e => e.stopPropagation()}>
              <Calculator
                value={displayValue}
                onChange={({ value, operator, prev }) => {
                  setDisplayValue(value)
                  setCalcOperator(operator)
                  setPrevValue(prev)
                  if (!operator) {
                    setForm({...form, amount: value})
                  }
                }}
                onClose={() => setCalculatorVisible(false)}
              />
            </View>
          )}
    
          {rowField.category && 
            <View>
              <View onClick={getCategories} className='f-column d-flex p-4 text-align-right flex-between flex-center'>
                <View>
                  <View className='iconfont jcon-category'></View>
                  <Text className="ml-2">分类</Text>
                </View>
                <View>{categoryName}</View>
              </View>
                {
                  categoryFrequent.length > 0 &&
                  (<View className='statement-form__quick-select'>
                    <Text className='col-text-mute'>快捷选择：</Text>
                    {
                      categoryFrequent.map((item) => {
                        return <View className='ui label' onClick={(e) => handleCategoryItemClick(e, item.parent, item)}>{item.name}</View>
                      })
                    }
                  </View>)
                }
            </View>
          }
    
          {rowField.asset && 
            <View>
              <View onClick={getAssets} className='f-column d-flex p-4 text-align-right flex-between flex-center'>
                <View>
                  <View className='iconfont jcon-wallet'></View>
                  <Text className="ml-2">{ ['income', 'loan_in'].includes(statementType) ? '入账' : '支出' }账户</Text>
                </View>
                <View>{assetName}</View>
              </View>
              {
                assetFrequent.length > 0 &&
                (<View className='statement-form__quick-select'>
                  <Text className='col-text-mute'>快捷选择：</Text>
                  {
                    assetFrequent.map((item) => {
                      return <View className='ui label' onClick={(e) => handleAssetItemClick(e, item.parent, item)}>{item.name}</View>
                    })
                  }
                </View>)
              }
            </View>
          }

          {
            rowField.transfer_asset &&
            <View className="f-column d-flex flex-between">
              <View className='asset-select-section'>
                <View className='asset-label'>资产</View>
                <View className='asset-content'>
                  <View 
                    className='asset-item' 
                    onClick={() => getAssets('from')}
                  >
                    <View>
                      <View className='label fs-14'>转出账户</View>
                      <Text className='value'>{findAssetName(form.from_asset_id)}</Text>
                    </View>
                    <Text className='iconfont icon-arrow-right' />
                  </View>
                  <View className='iconfont fs-24 jcon-arrow-right ml-2 mr-2'></View>
                  <View 
                    className='asset-item' 
                    onClick={() => getAssets('to')}
                  >
                    <View>
                      <View className='label fs-14'>转入账户</View>
                      <Text className='value'>{findAssetName(form.to_asset_id)}</Text>
                    </View>
                    <Text className='iconfont icon-arrow-right' />
                  </View>
                </View> 
              </View>
            </View>
          }

          {
            rowField.payment_proxy &&
            <View className="f-column d-flex p-4 flex-between flex-center">
              <View>
                <View className='fs-12 col-text-mute'>替谁代付</View>
                <View>借贷人</View>
              </View>
              <Input
                className='text-align-right'
                type='text'
                placeholder='请输入借贷人'
                value={form.target_object}
                onInput={e => setForm({...form, target_object: e.detail.value})}
              />
            </View>
          }

          {
            rowField.reimburse &&
            <View className="f-column d-flex p-4 flex-between flex-center">
              <View>
                <View className='fs-12 col-text-mute'>找谁报销</View>
                <View>报销方</View>
              </View>
              <Input
                className='text-align-right'
                type='text'
                placeholder='公司/项目方'
                value={form.target_object}
                onInput={e => setForm({...form, target_object: e.detail.value})}
              />
            </View>
          }

          {
            rowField.loan_in &&
            <View className="f-column d-flex p-4 flex-between flex-center">
              <View>
                <View className='fs-12 col-text-mute'>向谁借钱</View>
                <View>出借方</View>
              </View>
              <Input
                className='text-align-right'
                type='text'
                placeholder='找谁借'
                value={form.target_object}
                onInput={e => setForm({...form, target_object: e.detail.value})}
              />
            </View>
          }

          {
            rowField.loan_out &&
            <View className="f-column d-flex p-4 flex-between flex-center">
              <View>
                <View className='fs-12 col-text-mute'>借钱给谁</View>
                <View>借贷人</View>
              </View>
              <Input
                className='text-align-right'
                type='text'
                placeholder='借钱给谁'
                value={form.target_object}
                onInput={e => setForm({...form, target_object: e.detail.value})}
              />
            </View>
          }

          {
            targetObjects.length > 0 &&
            (<View className='statement-form__quick-select'>
              {
                targetObjects.map((targetName) => {
                  return <View className='ui label' onClick={() => handleTargetObjectClick(targetName)}>{targetName}</View>
                })
              }
            </View>)
          }

          <View>
            <AtTextarea
              className="fs-14"
              showConfirmBar={true}
              count={false}
              value={form.description}
              onChange={(detail) => setForm({ ...form, description: detail })}
              maxLength={200}
              placeholder='账单备注...'
            />
          </View>

          {/* 额外信息区域 */}
          <View className='statement-form__extra'>
              {showExtraFields.date && (
                <View>
                  <View className='f-column d-flex p-4 text-align-right flex-between flex-center'>
                    <View>日期时间</View>
                    <View className='d-flex'>
                      <Picker
                        mode='date'
                        value={form.date}
                        onChange={({detail}) => setForm({ ...form, date: detail.value })}
                      >
                        <View className='picker mr-2'>
                          {form.date}
                        </View>
                      </Picker>
                      <Picker
                        mode='time'
                        value={form.time}
                        onChange={({detail}) => setForm({ ...form, time: detail.value })}
                      >
                        <View className='picker'>
                          {form.time}
                        </View>
                      </Picker>
                    </View>
                  </View>
                </View>
              )}

              { (showExtraFields.uploadPic || form.upload_files.length > 0) && 
                <View>
                  <AtImagePicker
                    multiple
                    files={form.upload_files}
                    onChange={(files) => {setForm({ ...form, upload_files: files })}}
                  />
                </View>
              }
            </View>

            {/* 底部标签区域 */}
            <View className='statement-form__tags'>
              {!showExtraFields.date && (
                <Text className='tag' onClick={() => setShowExtraFields({...showExtraFields, date: true})}>
                  日期：今天
                </Text>
              )}

              <Text className='tag' onClick={() => setPayeeSelectActive(true)}>
                {payeeTags.find(tag => tag.id === form.payee_id)?.name || '商家'}
              </Text>
              
              <View className='mood-selector tag'>
                <Picker
                  mode='selector'
                  range={moodTags}
                  rangeKey='name'
                  onChange={async (e) => {
                    const mood = moodTags[e.detail.value].name
                    setForm({...form, mood: mood})
                  }}
                >
                  <View className='picker-content'>
                    {form.mood || '添加心情'}
                  </View>
                </Picker>
              </View>

              {!showExtraFields.uploadPic && (
                <Text className='tag' onClick={() => setShowExtraFields({...showExtraFields, uploadPic: true})}>
                  添加图片
                </Text>
              )}
            </View>
          </View>

          <View className="m-2">
            <View className='d-flex flex-between'>
                <Button 
                  title='再记一笔' 
                  onClick={() => {
                    submit({reload: true})
                  }} 
                  className='flex-shrink mr-2'
                  danger
                ></Button>
                <Button 
                  title='提交' 
                  onClick={submit} 
                  className='flex-grow'
                ></Button>
              </View>
          </View>
        </View>

      {
        categorySelectActive && 
        (<CategorySelect
           title='分类选择'
           handleClick={handleCategoryItemClick}
           frequent={categoryList.frequent}
           data={categoryList.data}
           setActive={setCategorySelectActive}
           loading={selectLoading}
         />)
      }

      {
        assetSelectActive && 
        (<CategorySelect
           title='资产选择'
           handleClick={handleAssetItemClick}
           frequent={assetList.frequent}
           data={assetList.data}
           setActive={setAssetSelectActive}
           loading={selectLoading}
         />)
      }

      {payeeSelectActive && (
        <PayeeSelect
          title={statementType === 'expend' ? '选择收款方' : '选择付款方'}
          handleClick={handlePayeeItemClick}
          data={payeeTags}
          setActive={setPayeeSelectActive}
          loading={selectLoading}
        />
      )}
    </View>
  )
}
