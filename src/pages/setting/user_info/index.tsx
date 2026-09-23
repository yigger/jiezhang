import BasePage from '@/components/BasePage'
import jz from '@/jz'
import { Button as JBTN } from '@/src/components/UiComponents'
import { Button, Image, Input, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { guardEvent, runTask } from '../../../utils/async'

const UserInfoPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState({
    avatar_url: '',
    nickname: ''
  })
  const [changeAvatar, setChangeAvatar] = useState(false)

  const getUserInfo = async () => {
    const { data } = await jz.withLoading(jz.api.users.getUserInfo())
    setUserInfo(data.data)
  }

  useEffect(() => {
    runTask(getUserInfo())
  }, [])

  const onSubmit = async () => {
    if (userInfo.nickname === '' || !userInfo.nickname) {
      jz.toastError('昵称不能为空哦~')
      return
    }
    await jz.api.users.updateUserInfo({ nickname: userInfo.nickname })
    if (changeAvatar) {
      await jz.api.upload(userInfo.avatar_url, {
        type: 'user_avatar'
      })
    }
    jz.router.navigateBack()
  }

  const onChooseAvatar = (e: { detail: { avatarUrl: string } }) => {
    const { avatarUrl } = e.detail
    if (avatarUrl) {
      const info = Object.assign({ ...userInfo, avatar_url: avatarUrl })
      setChangeAvatar(true)
      setUserInfo(info)
    }
  }

  return (
    <BasePage headerName="个人信息">
      <View className="user-info-page">
        <View className="info-avatar m-4 text-align-center">
          <Button style="background: none" open-type="chooseAvatar" onChooseAvatar={onChooseAvatar}>
            <Image src={userInfo.avatar_url}></Image>
          </Button>
        </View>

        <View className="info-detail">
          <View className="nickname-input bg-color-white p-4 d-flex">
            <Text className="col-text-mute">昵称</Text>
            <Input
              className="ml-4"
              name="nickname"
              type="nickname"
              placeholder="请输入昵称"
              value={userInfo.nickname}
              onFocus={(e) => {
                setUserInfo(Object.assign({ ...userInfo, nickname: e.detail.value }))
              }}
              onInput={(e) => {
                setUserInfo(Object.assign({ ...userInfo, nickname: e.detail.value }))
              }}
            />
          </View>
        </View>

        <View>
          <JBTN title="提交" onClick={guardEvent(onSubmit)}></JBTN>
        </View>
      </View>
    </BasePage>
  )
}

export default UserInfoPage
