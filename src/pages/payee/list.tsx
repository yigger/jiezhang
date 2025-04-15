import React, { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import BasePage from '@/components/BasePage'
import { Button } from '@/components/UiComponents'
import jz from '@/jz'
import Taro from '@tarojs/taro'

import './list.scss'

const PayeeList: React.FC = () => {
  const [payees, setPayees] = useState([])

  useEffect(() => {
    loadPayees()
  }, [])

  const loadPayees = async () => {
    const data = await jz.withLoading(await jz.api.payees.list())
    setPayees(data)
  }

  const handleSubmit = async (name: string) => {
    if (!name.trim()) {
      jz.toastError('请输入商家名称')
      return
    }
    try {
      await jz.api.payees.create({ name })
      loadPayees()
    } catch (error) {
      jz.toastError(error.message)
    }
  }

  const handleDelete = async (payee) => {
    const { confirm } = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除商家"${payee.name}"吗？`,
      confirmText: '删除',
      confirmColor: '#ff4d4f'
    })

    if (confirm) {
      try {
        await jz.api.payees.delete(payee)
        loadPayees()
      } catch (error) {
        jz.toastError(error.message)
      }
    }
  }

  const handleAdd = async () => {
    const { confirm, content } = await Taro.showModal({
      title: '添加商家',
      content: '',
      editable: true,
      placeholderText: '请输入商家名称',
      confirmText: '添加',
      cancelText: '取消'
    })
    if (confirm && content) {
      handleSubmit(content)
    }
  }

  const handleEdit = async (payee) => {
    const { confirm, content } = await Taro.showModal({
      title: '编辑商家',
      content: payee.name,
      editable: true,
      placeholderText: '请输入商家名称',
      confirmText: '保存',
      cancelText: '取消'
    })

    if (confirm && content) {
      try {
        await jz.api.payees.update(payee.id, { name: content })
        loadPayees()
      } catch (error) {
        jz.toastError(error.message)
      }
    }
  }

  return (
    <BasePage headerName='商家管理'>
      <View className='payee-list'>
        {payees.map((payee, _) => (
          <View
            key={payee.id}
            className={`payee-item d-flex flex-between flex-center p-4`}
          >
            <View className='d-flex flex-center'>
              <Text>{payee.name}</Text>
            </View>
            <View className='d-flex'>
              <Text
                className='mr-4 col-primary'
                onClick={() => handleEdit(payee)}
              >
                编辑
              </Text>
              <Text
                className='col-danger'
                onClick={() => handleDelete(payee)}
              >
                删除
              </Text>
            </View>
          </View>
        ))}

        <View className='p-4'>
          <Button
            type='primary'
            title='添加商家'
            onClick={handleAdd}
          />
        </View>
      </View>
    </BasePage>
  )
}

export default PayeeList