import { ApiError, isRecord } from '@/api/http-result'
import BasePage from '@/components/BasePage'
import jz from '@/jz'
import type { InviteInfo, InviteInfoResponse } from '@/src/api/types'
import { showModal } from '@/utils/modal'
import { Button, Image, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { guardEvent, runTask } from '../../utils/async'

export default function FriendInvitePage() {
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const params = jz.router.getParams()

  useEffect(() => {
    const fetchInviteInfo = async () => {
      const token = decodeURIComponent(params.token ?? '')
      if (!token) {
        jz.toastError('无效的邀请或邀请已过期，请重新获取邀请。')
        return
      }

      try {
        const response: {
          status: number
          message: string
          data: InviteInfoResponse
        } = await jz.withLoading(jz.api.friends.information(token))

        const data: InviteInfoResponse = response.data
        if (data.status !== 200) {
          jz.toastError(data.msg || '操作失败')
          return
        }

        setInviteInfo(data.data)
      } catch (error) {
        jz.toastError('获取邀请信息失败')
      }
    }

    runTask(fetchInviteInfo())
  }, [params.token])

  const handdleAcceptInvite = async () => {
    const { confirm, content } = await showModal({
      title: '设置昵称',
      content: '',
      editable: true,
      placeholderText: '请输入您的昵称'
    })

    if (!confirm || !content.trim()) {
      jz.toastError('请输入昵称')
      return
    }

    const token = decodeURIComponent(params.token ?? '')
    if (!inviteInfo) return
    try {
      await jz.withLoading(jz.api.friends.accept(token, content.trim()))
      jz.toastSuccess('已加入账簿')
    } catch (error) {
      if (!(
        error instanceof ApiError &&
        isRecord(error.result.data) &&
        error.result.data.status === 401
      ))
        throw error
      jz.toastSuccess('您已是该账簿的成员')
    }
    await jz.confirm('是否立即切换到新账本？')
    await jz.api.account_books.updateDefaultAccount(inviteInfo.account_book)
    await jz.router.redirectTo({ url: '/pages/home/index' })
  }

  if (!inviteInfo)
    return (
      <BasePage headerName="邀请加入记账">
        <View>正在加载邀请信息</View>
      </BasePage>
    )

  return (
    <BasePage headerName="邀请加入记账">
      <View className="friend-invite-page">
        <View className="invite-info-card">
          <View className="avatar-section">
            <Image className="avatar" src={inviteInfo.invite_user?.avatar_path} mode="aspectFill" />
            <View className="nickname">{inviteInfo.invite_user?.nickname}</View>
            <View className="text-mute">邀请您加入一起记账~</View>
          </View>

          <View className="info-section">
            <View className="info-item">
              <Text className="label">账本名称</Text>
              <Text className="value">{inviteInfo.account_book?.name}</Text>
            </View>
            <View className="info-item">
              <Text className="label">角色</Text>
              <Text className="value">{inviteInfo.role_name}</Text>
            </View>
          </View>

          <Button className="accept-btn" onClick={guardEvent(handdleAcceptInvite)}>
            接受邀请
          </Button>
        </View>
      </View>
    </BasePage>
  )
}
