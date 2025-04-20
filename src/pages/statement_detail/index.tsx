import { Component, useEffect, useState } from 'react'
import Taro from "@tarojs/taro"
import { View, Image, Text, Textarea, Picker } from '@tarojs/components'
import jz from '@/jz'
import BasePage from '@/components/BasePage'
import { Button } from '@/src/components/UiComponents'
import { useDidShow } from '@tarojs/taro'
import { AtImagePicker } from 'taro-ui'
import CategorySelect from '@/components/statementForm/CategorySelect'
import { format } from 'date-fns'

type StatementDetail = {
  id: number;
  amount: number;
  amount_number: number;
  asset: string;
  category: string;
  category_icon: string;
  description: string;
  location: string | null;
  residue: string;
  target_asset_id: number;
  time: string;
  title_category: string;
  type: string;
  upload_files: Array<any>;
  payee: {
    id: number;
    name: string
  },
  can_edit: boolean,
  remark: string;
}

const initialStatement: StatementDetail = {
  'id': 0,
  'amount': 0,
  'amount_number': 0,
  'asset': "",
  'category': "",
  'category_icon': "",
  'description': "",
  'location': null,
  'residue': "",
  'target_asset_id': 0,
  'time': "",
  'title_category': "",
  'type': "",
  'upload_files': [],
  'payee': {
    'id': 0,
    'name': ''
  },
  'can_edit': true
}

// 首先添加心情标签配置
const moodTags = [
  { name: '开心', color: '#52c41a', bgColor: 'rgba(82, 196, 26, 0.1)' },
  { name: '纠结', color: '#1890ff', bgColor: 'rgba(24, 144, 255, 0.1)' },
  { name: '后悔', color: '#ff4d4f', bgColor: 'rgba(255, 77, 79, 0.1)' },
  { name: '无奈', color: '#faad14', bgColor: 'rgba(250, 173, 20, 0.1)' },
  { name: '郁闷', color: '#722ed1', bgColor: 'rgba(114, 46, 209, 0.1)' },
  { name: '生气', color: '#f5222d', bgColor: 'rgba(245, 34, 45, 0.1)' }
]

const getTypeLabel = (type) => {
  switch(type) {
    case 'income':
      return '收入';
    case 'expend':
      return '支出';
    case 'transfer':
      return '转账';
    case 'repayment':
      return '还款';
    case 'loan_in':
      return '借入';
    case 'loan_out':
      return '借出';
    case 'reimburse':
      return '报销';
    case 'payment_proxy':
      return '代付';
    default:
      return '支出';
  }
}

const getTargetObjectLabel = (type) => {
  switch(type) {
    case 'payment_proxy':
      return '代付对象';
    case 'reimburse':
      return '报销方';
    case 'loan_in':
      return '出借方';
    case 'loan_out':
      return '借款方';
    default:
      return '';
  }
}

const StatementDetail: React.FC = () => {
  const params = jz.router.getParams()
  const [statement, setStatement] = useState(initialStatement)
  const [editing, setEditing] = useState({
    amount: false,
    category: false,
    asset: false,
    description: false,
    time: false
  })
  const [isEditMode, setIsEditMode] = useState(false)
  const [tempForm, setTempForm] = useState({})
  const [categorySelectActive, setCategorySelectActive] = useState(false)
  const [assetSelectActive, setAssetSelectActive] = useState(false)
  const [selectLoading, setSelectLoading] = useState(false)
  const [categoryList, setCategoryList] = useState({ frequent: [], data: [] })
  const [assetList, setAssetList] = useState({ frequent: [], data: [] })
  const [payeeSelectActive, setPayeeSelectActive] = useState(false)
  const [payeeTags, setPayeeTags] = useState([])

  const getStatementDetail = async () => {
    const statementId = params.statement_id
    const { data } = await jz.api.statements.getStatement(statementId)
    if (data?.status === 404) {
      jz.toastError('账单不存在')
      return
    }

    const upload_files = data.upload_files.map((file) => {
      return {
        id: file.id,
        url: file.url
      }
    })
    
    setStatement({...data, upload_files: upload_files})
  }

  const showPicPreview = (idx, file) => {
    Taro.previewImage({
      enablesavephoto: true,
      current: idx,
      urls: [file.url]
    })
  }

  const deleteStatement = async (statementId: number) => {
    await jz.confirm("是否删除该条账单？")
    await jz.api.statements.deleteStatement(statementId)
    jz.router.navigateBack()
  }

  useDidShow(() => {
    getStatementDetail()
  })

  const getMoodStyle = (mood) => {
    const moodTag = moodTags.find(tag => tag.name === mood) || moodTags[0]
    return {
      color: moodTag.color,
      background: moodTag.bgColor
    }
  }

  const canEdit = (type) => {
    switch (type) {
      case 'category':
        return ['income', 'expend'].includes(statement.type)
      case 'asset':
        return ['income', 'expend', 'loan_in', 'loan_out', 'reimburse', 'payment_proxy'].includes(statement.type)
      case 'payee':
        return true
      default:
        return false
    }
  }

  // 修改 handleEdit 中的 time 处理逻辑
  const handleEdit = async (field) => {
    if (field === 'amount') {
      const { confirm, content } = await Taro.showModal({
        title: '修改金额',
        editable: true,
        placeholderText: '请输入金额',
        content: Number(statement.amount_number) % 1 === 0 
                ? Math.floor(statement.amount_number).toString()
                : statement.amount_number.toString()
      })
      
      if (confirm && content) {
        try {
          const amount = parseFloat(content)
          if (isNaN(amount)) {
            jz.toastError('请输入有效的金额')
            return
          }
          updateStatement({ amount })
        } catch (error) {
          jz.toastError('保存失败')
        }
      }
      return
    }
    
    if (field === 'category') {
      if (!['expend', 'income'].includes(statement.type)) {
        jz.toastError('当前账单不支持修改分类')
        return
      }
      getCategories()
      return
    }
    
    if (field === 'asset') {
      if (!canEdit('asset')) {
        jz.toastError('当前账单不支持修改该资产')
        return
      }
      getAssets()
      return
    }

    if (field === 'payee') {
      jz.api.payees.list().then((data) => {
        setPayeeSelectActive(true)
        setPayeeTags(data)
      })
      return
    }

    setEditing({ ...editing, [field]: true })
    setTempForm({ ...tempForm, [field]: statement[field] })
  }

  const getCategories = async () => {
    setCategorySelectActive(true)
    setSelectLoading(true)
    const data = await jz.api.statements.categoriesWithForm(statement.type)
    if (data) {
      setCategoryList(data)
      setSelectLoading(false)
    }
  }

  const getAssets = async () => {
    setAssetSelectActive(true)
    setSelectLoading(true)
    const data = await jz.api.statements.assetsWithForm()
    if (data) {
      setAssetList(data)
      setSelectLoading(false)
    }
  }

  const updateStatement = async (data: Record<string, any>) => {
    try {
      const res = await jz.api.statements.update(statement.id, data)
      if (res.data?.status && res.data.status !== 200) {
        jz.toastError(res.data.msg)
      } else {
        await getStatementDetail()
        jz.event.emit('statement:updated')
        jz.toastSuccess('修改成功')
      }
    } catch (error) {
      jz.toastError('保存失败')
    }
  }

  // 修改现有的更新调用
  const handleCategoryItemClick = async (e, parent, item) => {
    try {
      await updateStatement({ category_id: item.id })
      setCategorySelectActive(false)
    } catch (error) {
      // 错误已在 updateStatement 中处理
    }
  }

  const handleAssetItemClick = async (e, parent, item) => {
    try {
      await updateStatement({ asset_id: item.id })
      setAssetSelectActive(false)
    } catch (error) {
      // 错误已在 updateStatement 中处理
    }
  }

  const handlePayeeItemClick = async (payee) => {
    try {
      await updateStatement({ payee_id: payee.id })
      setPayeeSelectActive(false)
    } catch (error) {
      // 错误已在 updateStatement 中处理
    }
  }

  const handleSave = async (field) => {
    if(tempForm[field] === undefined) {
      return
    }

    if(tempForm[field] !== statement[field]) {
      await updateStatement({ [field]: tempForm[field] })
    }
    setEditing({ ...editing, [field]: false })
  }

  const uploadFiles = async (files, optionType, index) => {
    if (optionType === 'add') {
      Taro.showLoading({
        title: '上传中...',
      })
      for (let file of files) {
        if (file.file) {
          await jz.api.upload(file.url, {
            type: 'statement_upload',
            statement_id: statement.id
          })
        }
      }      
    } else {
      await jz.confirm('确认删除这张图片吗？')
      await jz.api.statements.removeAvatar(statement.id, statement.upload_files[index]['id'])
    }
    Taro.hideLoading()
    getStatementDetail()
  }

  return (
    <BasePage headerName='账单详情'>
      <View className='jz-pages__statement-detail'>
        <View className='detail-header' style={getMoodStyle(statement.mood)}>
          <View className='d-flex flex-center-center'>
            <View className='statement-component__icon-image'>
              <Image src={statement.category_icon}></Image>
            </View>
          </View>
          
          {/* 添加心情选择器 */}
          <View className='mood-selector'>
            <Picker
              mode='selector'
              range={moodTags}
              rangeKey='name'
              onChange={async (e) => {
                const mood = moodTags[e.detail.value].name
                updateStatement({ mood })
              }}
            >
              <View className='mood-text'>
                {statement.mood || '选择心情'}
                <Text className='iconfont jcon-arrow-down ml-1'></Text>
              </View>
            </Picker>
          </View>

          <View className={`amount-wrapper ${isEditMode ? 'clickable' : ''}`} onClick={isEditMode ? () => handleEdit('amount') : undefined}>
            <View className='type-label'>{getTypeLabel(statement.type)}</View>
            <View className={`amount-text col-${statement.type}`}>
              { statement.amount }
            </View>
          </View>

          {statement.target_object && (
            <View className='target-object-text'>
              <Text className='label'>{getTargetObjectLabel(statement.type)}：</Text>
              <Text className='value'>{statement.target_object}</Text>
            </View>
          )}

          {
            !isEditMode && 
            <View 
              className={`time-text ${isEditMode ? 'clickable' : ''}`}
              onClick={isEditMode ? () => handleEdit('date') : undefined}
            >
              { statement.date } { statement.time }
            </View>
          }

          {
            isEditMode &&
            <Picker
              mode='date'
              value={statement.date}
              onChange={async (e) => {
                updateStatement({ date: format(new Date(e.detail.value), 'yyyy-MM-dd'), time: new Date(statement.time) })
              }}
            >
              <View className='picker'>{statement.date}</View>
            </Picker>
          }
        </View>

        {/* 详情信息列表 */}
        <View className='detail-content'>
          {
            statement.remark && (
              <View className='detail-item'>
                <View className='item-label'>
                  <View className='iconfont jcon-user'></View>
                  <Text>记账用户</Text>
                </View>
                <View className='item-value'>
                  { statement.remark }
                </View>
              </View>
            )
          }

          <View className='detail-item'>
            <View className='item-label'>
              <View className='iconfont jcon-category'></View>
              <Text>分类</Text>
            </View>
            <View className={`item-value ${isEditMode ? 'clickable' : ''}`} onClick={isEditMode ? () => handleEdit('category') : undefined}>
              { statement.category }
              {isEditMode && canEdit('category') && <Text className='edit-icon'>✏️</Text>}
            </View>
          </View>

          <View className='detail-item'>
            <View className='item-label'>
              <View className='iconfont jcon-wallet'></View>
              <Text>账户</Text>
            </View>
            <View className={`item-value ${isEditMode ? 'clickable' : ''}`} onClick={isEditMode ? () => handleEdit('asset') : undefined}>
              { statement.asset }
              {isEditMode && canEdit('asset') && <Text className='edit-icon'>✏️</Text>}
            </View>
          </View>

          { (statement.type === 'transfer' || statement.type === 'repayment') && statement.target_asset && (
              <View className='detail-item'>
                <View className='item-label'>
                  <View className='iconfont jcon-wallet'></View>
                  <Text>目标账户</Text>
                </View>
                <View className='item-value'>
                  { statement.target_asset.name }
                </View>
              </View>
            )
          }
 
          <View className='detail-item'>
            <View className='item-label'>
              <View className='iconfont jcon-shop'></View>
              <Text>商家</Text>
            </View>
            <View className={`item-value ${isEditMode ? 'clickable' : ''}`} onClick={isEditMode ? () => handleEdit('payee') : undefined}>
              { statement.payee?.name || '暂未选择' }
              {isEditMode && <Text className='edit-icon'>✏️</Text>}
            </View>
          </View>


          <View className='detail-item is-description'>
            <View className='item-label'>
              <View className='iconfont jcon-edit'></View>
              <Text>备注</Text>
            </View>
            <View className='item-value'>
              {editing.description ? (
                <Textarea
                  value={tempForm.description || ''}
                  onInput={e => setTempForm({ ...tempForm, description: e.detail.value })}
                  onBlur={() => handleSave('description')}
                  autoFocus
                />
              ) : (
                <View 
                  className={isEditMode ? 'clickable' : ''} 
                  onClick={isEditMode ? () => handleEdit('description') : undefined}
                >
                  {statement.description || '暂无备注'}
                  {isEditMode && <Text className='edit-icon'>✏️</Text>}
                </View>
              )}
            </View>
          </View>
          
          <View className='detail-item is-files'>
            <View className='item-label'>
              <View className='iconfont jcon-image'></View>
              <Text>关联图片</Text>
            </View>
            <View className='item-value'>
              <AtImagePicker
                showAddBtn={isEditMode}
                files={statement.upload_files}
                onChange={uploadFiles}
                onImageClick={showPicPreview}
              />
            </View>
          </View>
        </View>

        {/* 底部按钮 */}
        {
          statement.can_edit &&
          (<View className='detail-footer'>
            <Button
              title={isEditMode ? '完成' : '编辑'}
              className='primary'
              onClick={async () => {
                if (isEditMode) {
                  handleSave('description')
                  setCategorySelectActive(false)
                  setAssetSelectActive(false)
                }
                setIsEditMode(!isEditMode)
              }}
            />
            <Button
              title='删除'
              className='dangerous mt-3'
              onClick={() => deleteStatement(statement.id) }
            />
          </View>)
        }

        {categorySelectActive && (
          <CategorySelect
            title='选择分类'
            handleClick={handleCategoryItemClick}
            frequent={categoryList.frequent}
            data={categoryList.data}
            setActive={setCategorySelectActive}
            loading={selectLoading}
          />
        )}

        {assetSelectActive && (
          <CategorySelect
            title='选择账户'
            handleClick={handleAssetItemClick}
            frequent={assetList.frequent}
            data={assetList.data}
            setActive={setAssetSelectActive}
            loading={selectLoading}
          />
        )}

        {/* 添加弹出选择器 */}
        {payeeSelectActive && (
          <View className='statement-form__category-select'>
            <View className='category-select__mask' onClick={() => setPayeeSelectActive(false)} />
            <View className='category-select__main'>
              <View className='category-select__main-title d-flex flex-between flex-center'>
                <Text>{statement.type === 'expend' ? '选择收款方' : '选择付款方'}</Text>
                <Text 
                  className='col-primary' 
                  onClick={(e) => {
                    e.stopPropagation()
                    jz.router.navigateTo({url: '/pages/payee/list'})
                  }}
                >
                  管理商家
                </Text>
              </View>
              <View className='category-select__main-content'>
                {payeeTags.map((tag) => (
                  <View
                    key={tag.id}
                    className='f-column d-flex p-4 flex-between flex-center'
                    onClick={() => handlePayeeItemClick(tag)}
                  >
                    <Text>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

      </View>
    </BasePage>
  )
}

export default StatementDetail;