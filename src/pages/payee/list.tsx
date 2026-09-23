import type * as ApiTypes from '@/api/types'
import BasePage from '@/components/BasePage'
import { Button } from '@/components/UiComponents'
import jz from '@/jz'
import { showModal } from '@/utils/modal'
import { Text, View } from '@tarojs/components'
import React, { useEffect, useState } from 'react'
import { guardEvent, runTask } from '../../utils/async'

import './list.scss'

const PayeeList: React.FC = () => {
  const [payees, setPayees] = useState<ApiTypes.PayeeListItem[]>([])

  useEffect(() => {
    runTask(loadPayees())
  }, [])

  const loadPayees = async () => {
    const data = await jz.withLoading(jz.api.payees.list())
    setPayees(data)
  }

  const handleSubmit = async (name: string) => {
    if (!name.trim()) {
      jz.toastError('请输入商家名称')
      return
    }
    try {
      await jz.api.payees.create({ name })
      runTask(loadPayees())
    } catch (error) {
      jz.toastError(error instanceof Error ? error.message : '操作失败')
    }
  }

  const handleDelete = async (payee: ApiTypes.PayeeListItem) => {
    const { confirm } = await showModal({
      title: '确认删除',
      content: `确定要删除商家"${payee.name}"吗？`,
      confirmText: '删除',
      confirmColor: '#ff4d4f'
    })

    if (confirm) {
      try {
        await jz.api.payees.delete(payee)
        runTask(loadPayees())
      } catch (error) {
        jz.toastError(error instanceof Error ? error.message : '操作失败')
      }
    }
  }

  const handleAdd = async () => {
    const { confirm, content } = await showModal({
      title: '添加商家',
      content: '',
      editable: true,
      placeholderText: '请输入商家名称',
      confirmText: '添加',
      cancelText: '取消'
    })
    if (confirm && content) {
      runTask(handleSubmit(content))
    }
  }

  const handleEdit = async (payee: ApiTypes.PayeeListItem) => {
    const { confirm, content } = await showModal({
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
        runTask(loadPayees())
      } catch (error) {
        jz.toastError(error instanceof Error ? error.message : '操作失败')
      }
    }
  }

  return (
    <BasePage headerName="商家管理">
      <View className="payee-list">
        {payees.map((payee, _) => (
          <View key={payee.id} className={`payee-item d-flex flex-between flex-center p-4`}>
            <View className="d-flex flex-center">
              <Text>{payee.name}</Text>
            </View>
            <View className="d-flex">
              <Text className="mr-4 col-primary" onClick={guardEvent(() => handleEdit(payee))}>
                编辑
              </Text>
              <Text className="col-danger" onClick={guardEvent(() => handleDelete(payee))}>
                删除
              </Text>
            </View>
          </View>
        ))}

        <View className="p-4">
          <Button type="primary" title="添加商家" onClick={guardEvent(handleAdd)} />
        </View>
      </View>
    </BasePage>
  )
}

export default PayeeList
