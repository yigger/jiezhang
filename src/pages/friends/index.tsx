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
import Taro from '@tarojs/taro'

interface Friend {
  id: number
  user: {
    id: number
    nickname: string
    avatar: string
  }
  remark: string
  role: string
  role_name: string
  created_at: string
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [owner, setOwner] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('member')
  const [authority, setAuthority] = useState({})

  const permissionRoles = {
    member: {
      title: '普通成员',
      desc: '可以查看账簿的所有内容，可编辑修改 Ta 创建的数据，但无法更改他人的数据。',
    },
    admin: {
      title: '管理员',
      desc: '可以管理账簿所有的内容（*除了删除账簿外，其他操作均不受限制。）',
    },
    viewer: {
      title: '观察者',
      desc: '仅可查看账簿内容，无法更改任何内容。',
    }
  }

  useShareAppMessage(async () => {
    if (!selectedRole) {
      jz.toastError('请选择一个角色')
      return null
    }
    setIsModalOpen(false)
    if (editingFriend) {
      const { data } = await jz.api.friends.update({
        account_book_id: jz.storage.getCurrentAccountBook().id,
        collaborator_id: editingFriend.id,
        role: selectedRole
      })
      if (data.status === 200) {
        jz.toastSuccess('角色更新成功')
        fetchFriends()
      } else {
        jz.toastError(data.msg)
      }
      setEditingFriend(null)
      return null
    }

    const { data } = await jz.api.friends.invite({
      account_book_id: jz.storage.getCurrentAccountBook().id,
      role: selectedRole
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
    setSelectedRole('member')
  })

  const fetchFriends = async () => {
    const { data } = await jz.withLoading(jz.api.friends.list({
      account_book_id: jz.storage.getCurrentAccountBook().id
    }))
    setFriends(data.data.collaborators)
    setOwner(data.data.owner)
    setAuthority(data.data.authority)
  }

  useEffect(() => {
    fetchFriends()
  }, [])

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

  const handleSelectFriend = async (friend: Friend) => {
    setEditingFriend(friend)
    setSelectedRole(friend.role)
    if (friend.user.id === jz.currentUser.id) {
      const { confirm, content } = await Taro.showModal({
        title: '设置昵称',
        content: friend.remark,
        editable: true,
        placeholderText: '请输入您的昵称',
      })
      if (!confirm || !content.trim()) {
        return
      }
      await jz.api.friends.update({
        account_book_id: jz.storage.getCurrentAccountBook().id,
        collaborator_id: friend.id,
        remark: content.trim()
      })
      fetchFriends()
      return
    } else if (friend.user.id === owner.id) {
      // 创建着不可修改权限
      return
    } else {
      authority?.change_role && setIsModalOpen(true)
    }
  }

  return (
    <BasePage headerName='管理协作者'>
      <View className='friends-page'>
        <View className='friends-list'>
          {friends.map(friend => (
            <AtCard
              key={friend.id}
              className={`friend-card ${friend.user.id === jz.currentUser.id? 'current-user' : ''}`}
              title={`${jz.storage.getCurrentAccountBook().id === friend.user.id? '账簿创建者' : '协作者'}`}
              note={`${format(new Date(friend.created_at), 'yyyy年MM月dd日加入')}`}
            >
              <View
                className='friend-item'
                onClick={() => handleSelectFriend(friend)}
              >
                <Image
                  className='friend-avatar'
                  src={friend.user.avatar_path}
                  mode='aspectFill'
                />
                <View className='friend-info'>
                  <Text className='friend-name'>
                    {friend.remark || '未填写'} <Text className='col-text-link pl-1 fs-12'>{friend.user.id === jz.currentUser.id? '编辑昵称' : ''}</Text>
                  </Text>
                  <Text className='friend-permissions'>
                    角色：{friend.role_name}
                  </Text>
                </View>
                {
                  owner.id !== friend.user.id && (authority?.remove || jz.currentUser?.id === friend.user.id) &&
                  (
                    <View
                      className='friend-remove'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFriend(friend)
                      }}
                    >
                      { jz.currentUser?.id === friend.user.id ? '退出账簿' : '移出账簿'}
                    </View>
                  )
                }
              </View>
            </AtCard>
          ))}
        </View>

        {
          authority?.change_role &&
          <Button
            onClick={() => setIsModalOpen(true)}
            title='邀请好友'
          />
        }

        {isModalOpen && (
          <View className='modal-overlay'>
            <View className='modal-wrapper p-2'>
              <View className='modal-header'>
                <Text className='modal-title fs-16'>{editingFriend ? `更改【${editingFriend.remark}】的角色` : '选择邀请角色'}</Text>
                <Text className='modal-close fs-21' onClick={() => {
                  setEditingFriend(null)
                  setIsModalOpen(false)
                }}>×</Text>
              </View>
              <View className='modal-body'>
                {!editingFriend && <View className='text-align-center p-1 col-text-warn'>* 邀请链接 24 小时内有效 *</View>}
                {Object.entries(permissionRoles).map(([key, role]) => (
                  <View 
                    key={key} 
                    className={`permission-role ${selectedRole === key ? 'selected' : ''}`}
                    onClick={() => setSelectedRole(key)}
                  >
                    <View className='role-title'>{role.title}</View>
                    <View className='role-desc'>{role.desc}</View>
                  </View>
                ))}
              </View>
              <View className='modal-footer'>
                <Button title='取消' danger onClick={() => {
                  setEditingFriend(null)
                  setIsModalOpen(false)} 
                }/>
                <Button title='确认' openType='share' />
              </View>
            </View>
          </View>
        )}
      </View>
    </BasePage>
  )
}
