import BasePage from '@/components/BasePage'
import { View, Text, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { useShareAppMessage } from '@tarojs/taro'
import { AtCard, AtCheckbox, AtDivider } from 'taro-ui'
import { Button } from '@/components/UiComponents'
import { format } from 'date-fns'
import './index.scss'
import jz from '@/jz'
import config from '../../config'

interface Friend {
  id: number
  user: {
    id: number
    nickname: string
    avatar: string
  }
  access_name: string
  created_at: string
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [owner, setOwner] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editPermissions, setEditPermissions] = useState<string[]>([])

  const permissionOptions = [
    { value: 'read', label: '查看权限' },
    { value: 'write', label: '编辑权限' },
    { value: 'invite', label: '邀请他人权限' }
  ]

  useShareAppMessage(async () => {
    if (selectedPermissions.length === 0) {
      jz.toastError('请选择至少一个权限')
      return null
    }
    setIsModalOpen(false)
    setSelectedPermissions([])

    if (editingFriend) {
      return null
    }
    const { data } = await jz.api.friends.invite({
      account_book_id: jz.storage.getCurrentAccountBook().id,
      access: selectedPermissions
    })
    if (data.status === 200) {
      const token = data.data
      return {
        title: '邀请您加入一起记帐',
        path: `/pages/friends/invite_info?token=${token}`,
        imageUrl: `${config.host}/logo.png`
      }
    } else {
      jz.toastError(data.msg)
    }
  })

  const fetchFriends = async () => {
    const { data } = await jz.api.friends.list({
      account_book_id: jz.storage.getCurrentAccountBook().id
    })
    setFriends(data.data.collaborators)
    setOwner(data.data.owner)
  }

  useEffect(() => {
    fetchFriends()
  }, [])

  

  // 添加处理函数
  const handleEditPermissions = async () => {
    try {
      const { data } = await jz.api.friends.update({
        account_book_id: jz.storage.getCurrentAccountBook().id,
        collaborator_id: editingFriend.id,
        access: editPermissions
      })
      if (data.status === 200) {
        jz.toastSuccess('权限更新成功')
        fetchFriends()
      } else {
        jz.toastError(data.msg)
      }
    } catch (error) {
      jz.toastError('操作失败')
    }
    setIsEditModalOpen(false)
    setEditingFriend(null)
    setEditPermissions([])
  }

  const handleRemoveFriend = async (friend: Friend) => {
    try {
      const confirmed = await jz.confirm(`确定要${friend.user.id === jz.currentUser.id ? '退出账簿吗?' : '移出该成员吗?'}`)
      if (confirmed) {
        const { data } = await jz.api.friends.remove({
          account_book_id: jz.storage.getCurrentAccountBook().id,
          collaborator_id: friend.id
        })
        if (data.status === 200) {
          if (friend.user.id === jz.currentUser.id) {
            jz.router.redirectTo({url: '/pages/home/index'})
            return 
          }
          jz.toastSuccess('移出成功')
          fetchFriends()
        } else {
          jz.toastError(data.msg)
        }
      }
    } catch (error) {
      // 用户取消操作
    }
  }

  return (
    <BasePage headerName='管理协作者'>
      <View className='friends-page'>
        <View className='friends-list'>
          <AtCard
            key={owner.id}
            className='friend-card'
            title='账簿拥有者'
          >
            <View className='friend-item'>
              <Image
                className='friend-avatar'
                src={owner.avatar_path}
                mode='aspectFill'
              />
              <View className='friend-info'>
                <Text className='friend-name'>{owner.nickname || '未填写'}</Text>
              </View>
            </View>
          </AtCard>

          <AtDivider />

          {friends.map(friend => (
            <AtCard
              key={friend.id}
              className='friend-card'
              title='参与者'
              note={`${format(new Date(friend.created_at), 'yyyy年MM月dd日加入')}`}
            >
              <View
                className='friend-item'
                onClick={() => {
                  setEditingFriend(friend)
                  setEditPermissions([])
                  setIsEditModalOpen(true)
                }}
              >
                <Image
                  className='friend-avatar'
                  src={friend.user.avatar_path}
                  mode='aspectFill'
                />
                <View className='friend-info'>
                  <Text className='friend-name'>{friend.user.nickname || '未填写'}</Text>
                  <Text className='friend-permissions'>
                    权限：{friend.access_name}
                  </Text>
                </View>
                <View
                  className='friend-remove'
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFriend(friend)
                  }}
                >
                  { jz.currentUser?.id === friend.user.id ? '退出账簿' : '移出账簿'}
                </View>
              </View>
            </AtCard>
          ))}

          {isEditModalOpen && (
            <View className='modal-overlay'>
              <View className='modal-wrapper'>
                <View className='modal-header'>
                  <Text className='modal-title'>编辑权限</Text>
                  <Text className='modal-close' onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingFriend(null)
                    setEditPermissions([])
                  }}>×</Text>
                </View>
                <View className='modal-body'>
                  <View className='modal-desc'>
                    正在编辑 {editingFriend?.user.nickname || '未填写'} 的权限：
                  </View>
                  <View className='permission-list'>
                    <AtCheckbox
                      options={permissionOptions}
                      selectedList={editPermissions}
                      onChange={val => setEditPermissions(val)}
                    />
                  </View>
                </View>
                <View className='modal-footer'>
                  <Button title='取消' danger onClick={() => setIsEditModalOpen(false)} />
                  <Button title='确认' onClick={handleEditPermissions} />
                </View>
              </View>
            </View>
          )}
        </View>

        <Button
          onClick={() => setIsModalOpen(true)}
          title='邀请好友'
        />

        {isModalOpen && (
          <View className='modal-overlay'>
            <View className='modal-wrapper'>
              <View className='modal-header'>
                <Text className='modal-title'>设置权限</Text>
                <Text className='modal-close' onClick={() => {
                  setIsModalOpen(false)
                  setSelectedPermissions([])
                }}>×</Text>
              </View>
              <View className='modal-body'>
                <View className='modal-desc'>请选择要赋予的权限：</View>
                <View className='permission-list'>
                  <AtCheckbox
                    options={permissionOptions}
                    selectedList={selectedPermissions}
                    onChange={val => setSelectedPermissions(val)}
                  />
                </View>
              </View>
              <View className='modal-footer'>
                <Button title='取消' danger onClick={() => setIsModalOpen(false)} />
                <Button title='确认' openType='share' />
              </View>
            </View>
          </View>
        )}
      </View>
    </BasePage>
  )
}