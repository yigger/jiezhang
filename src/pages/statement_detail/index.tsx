import type * as ApiTypes from '@/api/types'
import AnnotationEditor from '@/components/Statistic/InsightWorkspace/AnnotationEditor'
import BasePage from '@/components/BasePage'
import type { SelectionHandler } from '@/components/statementForm/CategorySelect'
import CategorySelect from '@/components/statementForm/CategorySelect'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import { showModal } from '@/utils/modal'
import { parsePositiveAmount } from '@/utils/validation'
import { Image, Picker, Text, Textarea, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { ReactNode } from 'react'
import './index.scss'
import { AtImagePicker } from 'taro-ui'
import type { File } from 'taro-ui/types/image-picker'
import { guardEvent, runTask } from '../../utils/async'

type StatementDetail = ApiTypes.StatementDetailItem
const initialStatement: StatementDetail = {
  id: 0,
  type: '',
  amount: 0,
  amount_number: 0,
  asset: '',
  category: '',
  icon_path: '',
  description: '',
  location: '',
  residue: '',
  target_asset_id: 0,
  time: '',
  title: '',
  upload_files: [],
  payee: { id: 0, name: '' },
  can_edit: false,
  remark: '',
  date: '',
  mood: '',
  target_object: '',
  money: '',
  timeStr: '',
  week: '',
  category_id: 0,
  asset_id: 0,
  province: '',
  city: '',
  street: '',
  month_day: '',
  has_pic: false,
  created_at: '',
  updated_at: ''
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

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'income':
      return '收入'
    case 'expend':
      return '支出'
    case 'transfer':
      return '转账'
    case 'repayment':
      return '还款'
    case 'loan_in':
      return '借入'
    case 'loan_out':
      return '借出'
    case 'reimburse':
      return '报销'
    case 'payment_proxy':
      return '代付'
    default:
      return '支出'
  }
}

const getTargetObjectLabel = (type: string) => {
  switch (type) {
    case 'payment_proxy':
      return '代付对象'
    case 'reimburse':
      return '报销方'
    case 'loan_in':
      return '出借方'
    case 'loan_out':
      return '借款方'
    default:
      return ''
  }
}

function DetailRow({
  label,
  icon,
  children,
  onClick
}: {
  label: string
  icon: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <View className={`detail-row ${onClick ? 'is-editable' : ''}`} onClick={onClick}>
      <View className="detail-row__label">
        <Text className={`iconfont ${icon}`} />
        <Text>{label}</Text>
      </View>
      <View className="detail-row__value">
        {children}
        {onClick && <Text className="detail-row__arrow">›</Text>}
      </View>
    </View>
  )
}

const StatementDetail: React.FC = () => {
  const [analysisOpen, setAnalysisOpen] = useState(false)
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
  const [tempForm, setTempForm] = useState<Partial<ApiTypes.StatementWritePayload>>({})
  const [categorySelectActive, setCategorySelectActive] = useState(false)
  const [assetSelectActive, setAssetSelectActive] = useState(false)
  const [selectLoading, setSelectLoading] = useState(false)
  const [categoryList, setCategoryList] = useState<ApiTypes.SelectionData>({
    frequent: [],
    data: []
  })
  const [assetList, setAssetList] = useState<ApiTypes.SelectionData>({ frequent: [], data: [] })
  const [payeeSelectActive, setPayeeSelectActive] = useState(false)
  const [payeeTags, setPayeeTags] = useState<ApiTypes.PayeeListItem[]>([])

  const getStatementDetail = async () => {
    const statementId = params.statement_id ?? ''
    const { data } = await jz.api.statements.getStatement(statementId)

    const upload_files = data.upload_files.map((file) => {
      return {
        id: file.id,
        url: file.url
      }
    })

    setStatement({ ...data, upload_files: upload_files })
  }

  const showPicPreview = (_idx: number, file: File) => {
    runTask(
      Taro.previewImage({
        showmenu: true,
        current: file.url,
        urls: statement.upload_files.map((item) => item.url)
      })
    )
  }

  const deleteStatement = async (statementId: number) => {
    await jz.confirm('是否删除该条账单？')
    await jz.api.statements.deleteStatement(statementId)
    jz.event.emit('statement:updated')
    jz.router.navigateBack()
  }

  useDidShow(() => {
    runTask(getStatementDetail())
  })

  const getMoodStyle = (mood: string) => {
    const moodTag = moodTags.find((tag) => tag.name === mood) || moodTags[0]
    return {
      color: moodTag.color,
      background: moodTag.bgColor
    }
  }

  const canEdit = (type: string) => {
    switch (type) {
      case 'category':
        return ['income', 'expend'].includes(statement.type)
      case 'asset':
        return ['income', 'expend', 'loan_in', 'loan_out', 'reimburse', 'payment_proxy'].includes(
          statement.type
        )
      case 'payee':
        return true
      default:
        return false
    }
  }

  // 修改 handleEdit 中的 time 处理逻辑
  const handleEdit = async (
    field: 'amount' | 'category' | 'asset' | 'payee' | 'description' | 'date'
  ) => {
    if (field === 'amount') {
      const { confirm, content } = await showModal({
        title: '修改金额',
        editable: true,
        placeholderText: '请输入金额',
        content:
          Number(statement.amount_number) % 1 === 0
            ? Math.floor(statement.amount_number).toString()
            : statement.amount_number.toString()
      })

      if (confirm && content) {
        try {
          const amount = parsePositiveAmount(content)
          if (amount === null) {
            jz.toastError('请输入有效的金额')
            return
          }
          await updateStatement({ amount })
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
      runTask(getCategories())
      return
    }

    if (field === 'asset') {
      if (!canEdit('asset')) {
        jz.toastError('当前账单不支持修改该资产')
        return
      }
      runTask(getAssets())
      return
    }

    if (field === 'payee') {
      runTask(
        jz.api.payees.list().then((data) => {
          setPayeeSelectActive(true)
          setPayeeTags(data)
        })
      )
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

  const updateStatement = async (data: Partial<ApiTypes.StatementWritePayload>) => {
    if (!statement.can_edit) return
    try {
      const res = await jz.api.statements.update(statement.id, data)
      if (res.data?.status && res.data.status !== 200) {
        jz.toastError(res.data.msg || '修改失败')
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
  const handleCategoryItemClick: SelectionHandler = async (e, parent, item) => {
    try {
      await updateStatement({ category_id: item.id })
      setCategorySelectActive(false)
    } catch (error) {
      // 错误已在 updateStatement 中处理
    }
  }

  const handleAssetItemClick: SelectionHandler = async (e, parent, item) => {
    try {
      await updateStatement({ asset_id: item.id })
      setAssetSelectActive(false)
    } catch (error) {
      // 错误已在 updateStatement 中处理
    }
  }

  const handlePayeeItemClick = async (payee: ApiTypes.PayeeListItem) => {
    try {
      await updateStatement({ payee_id: payee.id })
      setPayeeSelectActive(false)
    } catch (error) {
      // 错误已在 updateStatement 中处理
    }
  }

  const handleSave = async (field: 'description') => {
    if (tempForm[field] === undefined) {
      return
    }

    if (tempForm[field] !== statement[field]) {
      await updateStatement({ [field]: tempForm[field] })
    }
    setEditing({ ...editing, [field]: false })
  }

  const uploadFiles = async (files: File[], optionType: 'add' | 'remove', index?: number) => {
    try {
      if (optionType === 'add') {
        runTask(
          Taro.showLoading({
            title: '上传中...'
          })
        )
        for (const file of files) {
          if (file.file) {
            await jz.api.upload(file.url, {
              type: 'statement_upload',
              statement_id: statement.id
            })
          }
        }
      } else {
        await jz.confirm('确认删除这张图片吗？')
        const file = statement.upload_files[index ?? -1]
        if (file) await jz.api.statements.removeAvatar(statement.id, file.id)
      }
    } finally {
      Taro.hideLoading()
      runTask(getStatementDetail())
    }
  }

  return (
    <BasePage headerName="账单详情" forceShowNavigatorBack>
      <View className="statement-detail">
        {statement.id === 0 ? (
          <View className="detail-loading">正在加载账单…</View>
        ) : (
          <>
            <View className={`detail-hero detail-hero--${statement.type}`}>
              <View className="detail-hero__top">
                <View className="detail-hero__identity">
                  {statement.icon_path ? (
                    <Image
                      className="detail-hero__icon"
                      src={statement.icon_path}
                      mode="aspectFit"
                    />
                  ) : (
                    <View className="detail-hero__icon detail-hero__fallback iconfont jcon-wallet" />
                  )}
                  <View>
                    <View className="detail-hero__category">
                      {statement.category || getTypeLabel(statement.type)}
                    </View>
                    <View className="detail-hero__type">{getTypeLabel(statement.type)}</View>
                  </View>
                </View>
                <Picker
                  mode="selector"
                  range={moodTags}
                  rangeKey="name"
                  disabled={!statement.can_edit}
                  onChange={guardEvent(async (e) => {
                    await updateStatement({ mood: moodTags[Number(e.detail.value)].name })
                  })}
                >
                  <View
                    className="detail-mood"
                    style={statement.mood ? getMoodStyle(statement.mood) : undefined}
                  >
                    {statement.mood || (statement.can_edit ? '记录心情' : '未记录心情')}
                    {statement.can_edit && <Text> ›</Text>}
                  </View>
                </Picker>
              </View>
              <View
                className={`detail-hero__amount ${isEditMode ? 'is-editable' : ''}`}
                onClick={isEditMode ? () => handleEdit('amount') : undefined}
              >
                <Text className="detail-hero__currency">¥</Text>
                {Number(statement.amount_number).toFixed(2)}
                {isEditMode && <Text className="detail-hero__edit">修改 ›</Text>}
              </View>
              <View className="detail-hero__time">
                {statement.date}
                <Text> · {statement.time}</Text>
              </View>
              {isEditMode && (
                <Picker
                  mode="date"
                  value={statement.date}
                  onChange={guardEvent(async (e) => {
                    await updateStatement({ date: e.detail.value })
                  })}
                >
                  <View className="detail-hero__date-edit">修改记账日期 ›</View>
                </Picker>
              )}
              {statement.target_object && (
                <View className="detail-hero__target">
                  {getTargetObjectLabel(statement.type)} · {statement.target_object}
                </View>
              )}
            </View>

            {isEditMode && <View className="detail-edit-hint">点击带箭头的信息即可修改</View>}
            <View className="detail-card">
              <View className="detail-card__heading">账单信息</View>
              <DetailRow
                label="分类"
                icon="jcon-category"
                onClick={
                  isEditMode && canEdit('category') ? () => handleEdit('category') : undefined
                }
              >
                {statement.category || '未设置'}
              </DetailRow>
              <DetailRow
                label={['transfer', 'repayment'].includes(statement.type) ? '转出账户' : '资产账户'}
                icon="jcon-wallet"
                onClick={isEditMode && canEdit('asset') ? () => handleEdit('asset') : undefined}
              >
                {statement.asset || '未设置'}
              </DetailRow>
              {['transfer', 'repayment'].includes(statement.type) && statement.target_asset && (
                <DetailRow label="目标账户" icon="jcon-wallet">
                  {statement.target_asset.name}
                </DetailRow>
              )}
              <DetailRow
                label="商家"
                icon="jcon-shop"
                onClick={isEditMode ? () => handleEdit('payee') : undefined}
              >
                {statement.payee?.name || <Text className="detail-empty">未选择</Text>}
              </DetailRow>
              {statement.remark && (
                <DetailRow label="记账人" icon="jcon-user">
                  {statement.remark}
                </DetailRow>
              )}
              {statement.location && (
                <DetailRow label="位置" icon="jcon-location">
                  {statement.location}
                </DetailRow>
              )}
            </View>

            <View className="detail-card">
              <View className="detail-card__heading">
                <View>备注</View>
                {isEditMode && !editing.description && (
                  <View className="detail-card__link" onClick={() => handleEdit('description')}>
                    {statement.description ? '修改' : '添加'} ›
                  </View>
                )}
              </View>
              {editing.description ? (
                <Textarea
                  className="detail-notes__input"
                  value={tempForm.description || ''}
                  maxlength={200}
                  placeholder="记下这笔消费的用途…"
                  onInput={(e) => setTempForm({ ...tempForm, description: e.detail.value })}
                  onBlur={guardEvent(() => handleSave('description'))}
                  autoFocus
                />
              ) : (
                <View
                  className={`detail-notes ${statement.description ? '' : 'detail-empty'}`}
                  onClick={isEditMode ? () => handleEdit('description') : undefined}
                >
                  {statement.description || '暂无备注'}
                </View>
              )}
            </View>

            <View className="detail-card">
              <View className="detail-card__heading">
                <View>图片凭证</View>
                <Text className="detail-card__count">{statement.upload_files.length} 张</Text>
              </View>
              {isEditMode ? (
                <AtImagePicker
                  showAddBtn
                  files={statement.upload_files}
                  onChange={guardEvent(uploadFiles)}
                  onImageClick={showPicPreview}
                />
              ) : statement.upload_files.length ? (
                <View className="detail-images">
                  {statement.upload_files.map((file, i) => (
                    <Image
                      key={file.id}
                      src={file.url}
                      mode="aspectFill"
                      onClick={() => showPicPreview(i, file)}
                    />
                  ))}
                </View>
              ) : (
                <View className="detail-empty detail-images__empty">
                  <Text className="iconfont jcon-image" />
                  {statement.can_edit ? '编辑时可添加小票或消费凭证' : '暂无图片凭证'}
                </View>
              )}
            </View>

            {['income', 'expend'].includes(statement.type) && (
              <View className="detail-analysis" onClick={() => setAnalysisOpen(true)}>
                <View className="detail-analysis__icon iconfont jcon-project" />
                <View className="detail-analysis__content">
                  <View>项目与付款分摊</View>
                  <Text>查看所属项目、消费人和付款分摊</Text>
                </View>
                <Text className="detail-analysis__arrow">›</Text>
              </View>
            )}
            {statement.can_edit && (
              <View className="detail-actions">
                <Button
                  title={isEditMode ? '完成编辑' : '编辑账单'}
                  className="detail-actions__edit"
                  onClick={guardEvent(async () => {
                    if (isEditMode) {
                      await handleSave('description')
                      setCategorySelectActive(false)
                      setAssetSelectActive(false)
                    }
                    setIsEditMode(!isEditMode)
                  })}
                />
                <View className="detail-actions__delete">
                  <Button
                    title="删除账单"
                    danger
                    onClick={guardEvent(() => deleteStatement(statement.id))}
                  />
                </View>
              </View>
            )}
            <View className="detail-meta">账单 #{statement.id}</View>
          </>
        )}
        {analysisOpen && (
          <AnnotationEditor
            statementID={statement.id}
            amount={statement.amount_number}
            type={statement.type}
            canEdit={statement.can_edit}
            onClose={() => setAnalysisOpen(false)}
          />
        )}

        {categorySelectActive && (
          <CategorySelect
            title="选择分类"
            handleClick={handleCategoryItemClick}
            frequent={categoryList.frequent}
            data={categoryList.data}
            setActive={setCategorySelectActive}
            loading={selectLoading}
          />
        )}

        {assetSelectActive && (
          <CategorySelect
            title="选择账户"
            handleClick={handleAssetItemClick}
            frequent={assetList.frequent}
            data={assetList.data}
            setActive={setAssetSelectActive}
            loading={selectLoading}
          />
        )}

        {/* 添加弹出选择器 */}
        {payeeSelectActive && (
          <View className="statement-form__category-select">
            <View className="category-select__mask" onClick={() => setPayeeSelectActive(false)} />
            <View className="category-select__main">
              <View className="category-select__main-title d-flex flex-between flex-center">
                <Text>{statement.type === 'expend' ? '选择收款方' : '选择付款方'}</Text>
                <Text
                  className="col-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    runTask(jz.router.navigateTo({ url: '/pages/payee/list' }))
                  }}
                >
                  管理商家
                </Text>
              </View>
              <View className="category-select__main-content">
                {payeeTags.map((tag) => (
                  <View
                    key={tag.id}
                    className="f-column d-flex p-4 flex-between flex-center"
                    onClick={guardEvent(() => handlePayeeItemClick(tag))}
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

export default StatementDetail
