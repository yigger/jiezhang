import BasePage from '@/components/BasePage'
import { View, Text, Image, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import jz from '@/jz'
import { InviteInfoResponse } from '@/src/api/types'

export default function FriendInvitePage() {
  const [inviteInfo, setInviteInfo] = useState<InviteInfoResponse>({})
  const params = jz.router.getParams()

  useEffect(() => {
    const fetchInviteInfo = async () => {
      const token = decodeURIComponent(params.token)
      if (!token) {
        jz.toastError('无效的邀请或邀请已过期，请重新获取邀请。')
        return
      }

      try {
        const response: { 
          status: number;
          message: string;
          data: InviteInfoResponse 
        } = await jz.withLoading(jz.api.friends.information(token))
        
        const data: InviteInfoResponse = response.data
        if (data.status !== 200) {
          jz.toastError(data.msg)
          return
        }
        
        setInviteInfo(data.data)
      } catch (error) {
        jz.toastError('获取邀请信息失败')
      }
    }

    fetchInviteInfo()
  }, [])

  const handdleAcceptInvite = async () => {
    const token = decodeURIComponent(params.token)
    const response: {
      status: number;
      message: string;
      data: any;
    } = await jz.withLoading(jz.api.friends.accept(token))
    const data = response.data
    if (data.status === 401) {
      Taro.showToast({
        title: data.msg,
        duration: 2000,
        icon: 'none',
        success: async () => {
          await jz.api.account_books.updateDefaultAccount(inviteInfo.account_book)
          setTimeout(() => {
            jz.router.redirectTo({ url: '/pages/home/index' })
          }, 1500)
        }
      })
    } else if (data.status === 200) {
      jz.toastSuccess(data.msg)
      await jz.confirm('是否立即切换到新账本？')
      await jz.api.account_books.updateDefaultAccount(inviteInfo.account_book)
    } else {
      jz.toastError(data.msg)
    }
  }

  return (
    <BasePage headerName='邀请加入记账'>
      <View className='friend-invite-page'>
        <View className='invite-info-card'>
          <View className='avatar-section'>
            <Image 
              className='avatar' 
              src={inviteInfo.invite_user?.avatar_path} 
              mode='aspectFill'
            />
            <View className='nickname'>{inviteInfo.invite_user?.nickname}</View>
            <View className='text-mute'>邀请您加入一起记账~</View>
          </View>
          
          <View className='info-section'>
            <View className='info-item'>
              <Text className='label'>账本名称</Text>
              <Text className='value'>{inviteInfo.account_book?.name}</Text>
            </View>
            <View className='info-item'>
              <Text className='label'>权限</Text>
              <Text className='value'>{inviteInfo.access}</Text>
            </View>
          </View>

          <Button 
            className='accept-btn'
            onClick={handdleAcceptInvite}
          >
            接受邀请
          </Button>
        </View>
      </View>
    </BasePage>
  )
}