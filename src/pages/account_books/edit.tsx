import Taro from '@tarojs/taro'
import { View } from "@tarojs/components"
import BasePage from '@/components/BasePage'
import { useEffect, useState } from "react"
import jz from '@/jz'
import { format } from 'date-fns'
import { Input, Button, Textarea, SelectInput } from '@/src/components/UiComponents'

const AccountBookEdit = () => {
  const [accountBook, setAccountBook] = useState({
    id: 0,
    name: '',
    description: '',
    type: '',
    account_type: null
  })
  const [types, setTypes] = useState([])
  const getTypes = async () => {
    const { data } = await jz.api.account_books.getAccountBookTypes()
    if (data.data) {
      setTypes(data.data)
    }
  }
  const getAccountBook = async() => {
    const params = await jz.router.getParams()
    const { data } = await jz.api.account_books.getAccountBook(params.id)
    if (data.status === 200) {
      setAccountBook(data.data)
    } else {
      jz.toastError(data.msg)
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
    } else [
      jz.toastError(data.msg)
    ]
  }

  const onSwitch = async () => {
    await jz.confirm('切换到新账簿吗？')
    Taro.showLoading('切换中')
    await jz.api.account_books.updateDefaultAccount(accountBook)
    Taro.hideLoading()
    jz.router.redirectTo({ url: '/pages/home/index' })
  }

  const onDelete = async () => {
    await jz.confirm("删除账簿会删除账簿下的账单/分类/资产，此操作不可恢复！", "重要提示！")
    const { data } = await jz.api.account_books.destroy(accountBook.id)
    if (data.status === 200) {
      await jz.toastError('删除成功', 1500)
      jz.router.redirectTo({ url: '/pages/home/index' })
    } else [
      jz.toastError(data.msg)
    ]
  }

  useEffect(() => {
    getTypes()
    getAccountBook()
  }, [])

  return (
    <BasePage
      headerName='编辑账簿'
    >
      <View>
        <View>
          <Input
            title='账簿名称'
            placeholder='请输入账簿名称'
            data={accountBook.name}
            setData={(data) => { setAccountBook({...accountBook, name: data}) }}
          ></Input>
        </View>

        <View>
          <View>
            <SelectInput
              title='账簿类型'
              keyName="name"
              setSelected={(data) => { setAccountBook({...accountBook, account_type: data}) }}
              selected={accountBook.account_type}
              list={types}
            ></SelectInput>
          </View>
        </View>

        <View>
          <Textarea
            title='描述'
            placeholder='请输入描述...'
            data={accountBook.description}
            setData={(data) => { setAccountBook({...accountBook, description: data}) }}
          ></Textarea>
        </View>

        <Button title='保存' onClick={() => onSubmit()}></Button>
        <Button title='切换到此账簿' onClick={() => onSwitch()}></Button>
        <Button title='删除' danger onClick={() => onDelete()}></Button>
      </View>
    </BasePage>
    
  )
}

export default AccountBookEdit