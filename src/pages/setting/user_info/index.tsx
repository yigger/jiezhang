import { useEffect, useState } from 'react'
import { View, Image, Button, Input, Text } from '@tarojs/components'
import jz from '@/jz'
import BasePage from '@/components/BasePage'
import { Button as JBTN } from '@/src/components/UiComponents'
import Taro from "@tarojs/taro"

const UserInfoPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState({
    avatar_path: '',
    nickname: ''
  })
  const [changeAvatar, setChangeAvatar] = useState(false)

  const getUserInfo = async () => {
    Taro.showLoading({
      title: 'loading',
    })
    const { data } = await jz.api.users.getUserInfo()
    Taro.hideLoading()
    setUserInfo(data.data)
  }

  useEffect(() => {
    getUserInfo()
  }, [])

  const onSubmit = async () => {
    if (userInfo.nickname === '' || !userInfo.nickname) {
      jz.toastError('昵称不能为空哦~')
      return 
    }
    await jz.api.users.updateUserInfo({nickname: userInfo.nickname})
    if (changeAvatar) {
      await jz.api.upload(userInfo.avatar_path, {
        type: 'user_avatar'
      })
    }
    jz.router.navigateBack()
  }

  const onChooseAvatar = (e) => {
    const { avatarUrl } = e.detail
    if (avatarUrl) {
      const info = Object.assign({...userInfo, avatar_path: avatarUrl})
      setChangeAvatar(true)
      setUserInfo(info)
    }
  }

  return (
    <BasePage
      headerName='个人信息'
    >
      <View className='user-info-page'>
        <View className='info-avatar m-4 text-align-center'>
          <Button style="background: none" open-type="chooseAvatar" onChooseAvatar={onChooseAvatar}>
            <Image src={userInfo.avatar_path}></Image>
          </Button> 
        </View>

        <View className='info-detail'>
          <View className='nickname-input bg-color-white p-4 d-flex'>
            <Text className='col-text-mute'>昵称</Text>
            <Input
              className='ml-4'
              name='nickname'
              type='nickname'
              placeholder='请输入昵称'
              value={userInfo.nickname}
              onFocus={(e) => { setUserInfo(Object.assign({...userInfo, nickname: e.detail.value})) }}
              onInput={(e) => { setUserInfo(Object.assign({...userInfo, nickname: e.detail.value})) }}
            />
          </View>
        </View>

        <View>
          <JBTN title='提交' onClick={onSubmit}></JBTN>
        </View>

      </View>
    </BasePage>
  )
}

export default UserInfoPage