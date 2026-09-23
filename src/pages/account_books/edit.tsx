import type * as ApiTypes from '@/api/types'
import BasePage from '@/components/BasePage'
import jz from '@/jz'
import { Button, Input, SelectInput, Textarea } from '@/src/components/UiComponents'
import { View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { guardEvent, runTask } from '../../utils/async'

const AccountBookEdit = () => {
  const [accountBook, setAccountBook] = useState<ApiTypes.AccountBookDetailItem>({
    id: 0,
    name: '',
    description: '',
    account_type: { id: '', name: '' }
  })
  const [types, setTypes] = useState<ApiTypes.AccountBookTypeItem[]>([])
  const getTypes = async () => {
    const { data } = await jz.api.account_books.getAccountBookTypes()
    if (data.data) {
      setTypes(data.data)
    }
  }
  const getAccountBook = async () => {
    const params = await jz.router.getParams()
    const { data } = await jz.api.account_books.getAccountBook(params.id ?? '')
    if (data.status === 200) {
      setAccountBook(data.data)
    } else {
      jz.toastError(data.msg || '操作失败')
    }
  }

  const onSubmit = async () => {
    if (accountBook.name === '') {
      jz.toastError('需要填写一个名称哦~')
      return false
    }
    const { data } = await jz.api.account_books.update(accountBook.id, accountBook)
    if (data.status === 200) {
      jz.router.navigateBack()
    } else [jz.toastError(data.msg || '操作失败')]
  }

  const onSwitch = async () => {
    await jz.confirm('切换到新账簿吗？')
    await jz.withLoading(jz.api.account_books.updateDefaultAccount(accountBook))
    runTask(jz.router.redirectTo({ url: '/pages/home/index' }))
  }

  const onDelete = async () => {
    await jz.confirm('删除账簿会删除账簿下的账单/分类/资产，此操作不可恢复！', '重要提示！')
    const { data } = await jz.api.account_books.destroy(accountBook.id)
    if (data.status === 200) {
      await jz.toastError('删除成功', 1500)
      runTask(jz.router.redirectTo({ url: '/pages/home/index' }))
    } else [jz.toastError(data.msg || '操作失败')]
  }

  useEffect(() => {
    runTask(getTypes())
    runTask(getAccountBook())
  }, [])

  return (
    <BasePage headerName="编辑账簿">
      <View>
        <View>
          <Input
            title="账簿名称"
            placeholder="请输入账簿名称"
            data={accountBook.name}
            setData={(data) => {
              setAccountBook({ ...accountBook, name: data })
            }}
          ></Input>
        </View>

        <View>
          <View>
            <SelectInput
              title="账簿类型"
              keyName="name"
              setSelected={(data) => {
                setAccountBook({ ...accountBook, account_type: data })
              }}
              selected={accountBook.account_type}
              list={types}
            ></SelectInput>
          </View>
        </View>

        <View>
          <Textarea
            title="描述"
            placeholder="请输入描述..."
            data={accountBook.description}
            setData={(data) => {
              setAccountBook({ ...accountBook, description: data })
            }}
          ></Textarea>
        </View>

        <Button title="保存" onClick={guardEvent(() => onSubmit())}></Button>
        <Button title="切换到此账簿" onClick={guardEvent(() => onSwitch())}></Button>
        <Button title="删除" danger onClick={guardEvent(() => onDelete())}></Button>
      </View>
    </BasePage>
  )
}

export default AccountBookEdit
