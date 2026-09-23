import type * as ApiTypes from '@/api/types'
import BasePage from '@/components/BasePage'
import { Button } from '@/components/UiComponents'
import jz from '@/jz'
import { showModal } from '@/utils/modal'
import { Image, Text, View } from '@tarojs/components'
import { useShareAppMessage } from '@tarojs/taro'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { AtCard } from 'taro-ui'
import config from '../../config'
import { guardEvent, runTask } from '../../utils/async'
import './index.scss'

type Friend = ApiTypes.FriendCollaboratorItem

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [owner, setOwner] = useState<Partial<ApiTypes.FriendUserItem>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('member')
  const [authority, setAuthority] = useState<Partial<ApiTypes.FriendAuthority>>({})

  const permissionRoles = {
    member: {
      title: '普通成员',
      desc: '可以查看账簿的所有内容，可编辑修改 Ta 创建的数据，但无法更改他人的数据。'
    },
    admin: {
      title: '管理员',
      desc: '可以管理账簿所有的内容（*除了删除账簿外，其他操作均不受限制。）'
    },
    viewer: {
      title: '观察者',
      desc: '仅可查看账簿内容，无法更改任何内容。'
    }
  }

  const saveRole = async () => {
    if (!editingFriend) return
    await jz.api.friends.update({
      account_book_id: (await jz.ensureAccountBook()).id,
      collaborator_id: editingFriend.id,
      role: selectedRole
    })
    setEditingFriend(null)
    setIsModalOpen(false)
    jz.toastSuccess('角色更新成功')
    await fetchFriends()
  }

  useShareAppMessage(async () => {
    const { data } = await jz.api.friends.invite({
      account_book_id: (await jz.ensureAccountBook()).id,
      role: selectedRole
    })
    setIsModalOpen(false)
    return {
      title: '邀请您加入一起记帐',
      path: `/pages/friends/invite_info?token=${encodeURIComponent(data.data)}`,
      imageUrl: `${config.host}/logo.png`
    }
  })

  const fetchFriends = async () => {
    const { data } = await jz.withLoading(
      jz.api.friends.list({
        account_book_id: (await jz.ensureAccountBook()).id
      })
    )
    setFriends(data.data.collaborators)
    setOwner(data.data.owner)
    setAuthority(data.data.authority)
  }

  useEffect(() => {
    runTask(fetchFriends())
  }, [])

  const handleRemoveFriend = async (friend: Friend) => {
    try {
      await jz.confirm(
        `确定要${friend.user.id === jz.currentUser?.id ? '退出账簿吗?' : '移出该成员吗?'}`
      )
      {
        const { data } = await jz.api.friends.remove({
          account_book_id: (await jz.ensureAccountBook()).id,
          collaborator_id: friend.id
        })
        if (data.status === 200) {
          if (friend.user.id === jz.currentUser?.id) {
            runTask(jz.router.redirectTo({ url: '/pages/home/index' }))
            return
          }
          jz.toastSuccess('移出成功')
          runTask(fetchFriends())
        } else {
          jz.toastError(data.msg || '操作失败')
        }
      }
    } catch (error) {
      // 用户取消操作
    }
  }

  const handleSelectFriend = async (friend: Friend) => {
    setEditingFriend(friend)
    setSelectedRole(friend.role)
    if (friend.user.id === jz.currentUser?.id) {
      const { confirm, content } = await showModal({
        title: '设置昵称',
        content: friend.remark,
        editable: true,
        placeholderText: '请输入您的昵称'
      })
      if (!confirm || !content.trim()) {
        return
      }
      await jz.api.friends.update({
        account_book_id: (await jz.ensureAccountBook()).id,
        collaborator_id: friend.id,
        remark: content.trim()
      })
      runTask(fetchFriends())
      return
    } else if (friend.user.id === owner.id) {
      // 创建着不可修改权限
      return
    } else {
      authority?.change_role && setIsModalOpen(true)
    }
  }

  return (
    <BasePage headerName="管理协作者">
      <View className="friends-page">
        <View className="friends-list">
          {friends.map((friend) => (
            <AtCard
              key={friend.id}
              className={`friend-card ${friend.user.id === jz.currentUser?.id ? 'current-user' : ''}`}
              title={`${owner.id === friend.user.id ? '账簿创建者' : '协作者'}`}
              note={`${format(new Date(friend.created_at), 'yyyy年MM月dd日加入')}`}
            >
              <View className="friend-item" onClick={guardEvent(() => handleSelectFriend(friend))}>
                <Image className="friend-avatar" src={friend.user.avatar_path} mode="aspectFill" />
                <View className="friend-info">
                  <Text className="friend-name">
                    {friend.remark || '未填写'}{' '}
                    <Text className="col-text-link pl-1 fs-12">
                      {friend.user.id === jz.currentUser?.id ? '编辑昵称' : ''}
                    </Text>
                  </Text>
                  <Text className="friend-permissions">角色：{friend.role_name}</Text>
                </View>
                {owner.id !== friend.user.id &&
                  (authority?.remove || jz.currentUser?.id === friend.user.id) && (
                    <View
                      className="friend-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        runTask(handleRemoveFriend(friend))
                      }}
                    >
                      {jz.currentUser?.id === friend.user.id ? '退出账簿' : '移出账簿'}
                    </View>
                  )}
              </View>
            </AtCard>
          ))}
        </View>

        {authority?.change_role && (
          <Button
            onClick={() => {
              setEditingFriend(null)
              setIsModalOpen(true)
            }}
            title="邀请好友"
          />
        )}

        {isModalOpen && (
          <View className="modal-overlay">
            <View className="modal-wrapper p-2">
              <View className="modal-header">
                <Text className="modal-title fs-16">
                  {editingFriend ? `更改【${editingFriend.remark}】的角色` : '选择邀请角色'}
                </Text>
                <Text
                  className="modal-close fs-21"
                  onClick={() => {
                    setEditingFriend(null)
                    setIsModalOpen(false)
                  }}
                >
                  ×
                </Text>
              </View>
              <View className="modal-body">
                {!editingFriend && (
                  <View className="text-align-center p-1 col-text-warn">
                    * 邀请链接 24 小时内有效 *
                  </View>
                )}
                {Object.entries(permissionRoles).map(([key, role]) => (
                  <View
                    key={key}
                    className={`permission-role ${selectedRole === key ? 'selected' : ''}`}
                    onClick={() => setSelectedRole(key)}
                  >
                    <View className="role-title">{role.title}</View>
                    <View className="role-desc">{role.desc}</View>
                  </View>
                ))}
              </View>
              <View className="modal-footer">
                <Button
                  title="取消"
                  danger
                  onClick={() => {
                    setEditingFriend(null)
                    setIsModalOpen(false)
                  }}
                />
                {editingFriend ? (
                  <Button title="保存角色" onClick={guardEvent(saveRole)} />
                ) : (
                  <Button title="确认邀请" openType="share" />
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    </BasePage>
  )
}
