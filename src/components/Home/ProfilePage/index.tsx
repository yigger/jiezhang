import jz from '@/jz'
import { useContext, useEffect, useState } from 'react'
import { differenceInDays } from 'date-fns'
import { View, Image, Picker, Text } from '@tarojs/components'
import { AtList, AtListItem, AtIcon } from "taro-ui"
import { HomeStoreContext } from "@/src/stores"
import { useDidShow } from '@tarojs/taro'
import { observer } from 'mobx-react'
import Select from '@/components/Select'

import "taro-ui/dist/style/components/list.scss";
import "taro-ui/dist/style/components/icon.scss";

const nowStr = () => {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour >= 0 && currentHour < 12) {
    return '早上好'
  } else if (currentHour >= 12 && currentHour < 18) {
    return '下午好'
  } else {
    return '晚上好'
  }
}

function UserInfo ({
  userInfo
}) {
  return (
    <View className='user-info m-4 p-4'>
      <View className='d-flex flex-center'>
        <View className='jz-image-normal radius'>
          <Image src={userInfo.avatar_url}></Image>
        </View>

        <View className='username-and-desc flex-1 ml-2'>
          <View className='username d-flex flex-between'>
            <Text className='name'>{userInfo.name || '未设置昵称'}</Text>
            <Text className='edit-text' onClick={() => { jz.router.navigateTo({url: '/pages/setting/user_info/index'}) }}>编辑资料</Text>
          </View>
          <View className='fs-12 col-text-mute mt-2'>
            <View>{nowStr()}，今天是你记账的第 {differenceInDays(new Date(), new Date(userInfo.created_at))} 天</View>
            <View className='pt-2'>累计记账共 {userInfo.persist} 笔</View>
          </View>
        </View>
      </View> 

      <View className='feature d-flex mt-4 pt-4'>
        <View className='flex-1 text-align-center' onClick={() => { jz.router.navigateTo({url: '/pages/setting/search/search'}) }}>
          <View className='iconfont jcon-search1' style='font-size: 18PX'></View>
          <View className='fs-14'>搜索</View>
        </View>
        <View className='flex-1 text-align-center' onClick={() => { jz.router.navigateTo({url: '/pages/setting/statements_flow/index'}) }}>
          <View className='iconfont jcon-transaction' style='font-size: 18PX'></View>
          <View className='fs-14'>流水</View>
        </View>
        <View className='flex-1 text-align-center' onClick={() => { jz.router.navigateTo({url: '/pages/sub/chart/index'}) }}>
          <View className='iconfont jcon-piechart' style='font-size: 18PX'></View>
          <View className='fs-14'>报表</View>
        </View>
      </View>
    </View>
  )
}

export const ProfilePage = observer(() => {
  const store: HomeStoreContext = useContext(HomeStoreContext)
  const [shouldFetch, setShouldFetch] = useState(true)
  useEffect(() => {
    if (shouldFetch) {
      store.getProfileData()
      setShouldFetch(false)
    }
  }, [shouldFetch])

  useDidShow(() => {
    setShouldFetch(true);
  })

  const [themeSelectOpen, setThemeSelectOpen] = useState(false)
  const [selectedTheme, setSelectTheme] = useState(null)
  const onSelectedTheme = (selectedTheme) => {
    setSelectTheme(selectedTheme)
  }
  const handleToggle = () => {
    setThemeSelectOpen(!themeSelectOpen)
  }
  const handleSelectSubmit = async () => {
    if (selectedTheme) {
      const selectTheme = store.profileData.userInfo.themes.find((item) => Number(item.id) === Number(selectedTheme.id))
      await jz.api.users.updateUserInfo({theme_id: selectTheme.id})
      store.getProfileData()
    }
    setThemeSelectOpen(false)
  }

  return (
    <View className='jz-pages__profile'>
      <View>
        <UserInfo userInfo={store.profileData.userInfo}/>
        
        {/* 账簿管理 */}
        <View className='setting-group'>
          <View className='group-title'>账簿管理</View>
          <AtList className='fs-12'>
            <AtListItem title='切换账簿' extraText={store.currentAccountBook?.name} onClick={() => jz.router.navigateTo({url: '/pages/account_books/list'})} />
            <AtListItem title='邀请朋友加入账簿' arrow='right' onClick={() => jz.router.navigateTo({url: '/pages/friends/index'})}/>
            <AtListItem title='分享账单给朋友' arrow='right' onClick={() => jz.router.navigateTo({url: '/pages/share/index'})}/>
          </AtList>
        </View>

        {/* 账单管理 */}
        <View className='setting-group'>
          <View className='group-title'>账单管理</View>
          <AtList className='fs-12'>
            <AtListItem title='预算管理' arrow='right' onClick={() => jz.router.navigateTo({url: '/pages/setting/budget/index'})}/>
            <AtListItem title='账单图库' arrow='right' onClick={() => jz.router.navigateTo({url: '/pages/setting/statement_imgs/index'})}/>
            <AtListItem title='账单导入' arrow='right' onClick={() => jz.router.navigateTo({url: '/pages/setting/statements_manage/data_in'})}/>
            <AtListItem title='账单导出' arrow='right' onClick={() => jz.router.navigateTo({url: '/pages/setting/statements_manage/data_out'})}/>
          </AtList>
        </View>

        {/* 分类与资产 */}
        <View className='setting-group'>
          <View className='group-title'>分类与资产</View>
          <AtList className='fs-12'>
            <AtListItem title='资产管理' arrow='right' onClick={() => jz.router.navigateTo({url: '/pages/setting/asset/index'})}/>
            <AtListItem title='支出分类管理' arrow='right' onClick={() => jz.router.navigateTo({url: '/pages/setting/category/index?type=expend'})}/>
            <AtListItem title='收入分类管理' arrow='right' onClick={() => jz.router.navigateTo({url: '/pages/setting/category/index?type=income'})}/>
          </AtList>
        </View>

        {/* 其他设置 */}
        <View className='setting-group'>
          <View className='group-title'>其他设置</View>
          <AtList className='fs-12'>
            <AtListItem title='站内信' arrow='right' onClick={() => jz.router.navigateTo({url: '/pages/setting/messages/index'})}/>
            <AtListItem title='主题设置' extraText={store.profileData.userInfo.theme?.name} onClick={() => setThemeSelectOpen(true) }/>
            <AtListItem title='意见反馈' arrow='right' onClick={() => jz.router.navigateTo({url: '/pages/setting/feedback/index'})} />
            <AtListItem title='关于洁账' extraText={store.profileData.version} />
          </AtList>
        </View>
      </View>

      <Select
        title='主题选择'
        open={themeSelectOpen}
        onToggle={handleToggle}
        onSelectedItem={onSelectedTheme}
        onSubmit={handleSelectSubmit}
      >
        <View>
          {
            store.profileData.userInfo.themes?.map((item) => {
              return (
                <View
                  className={`select-item d-flex flex-between p-2 ${item['name'] === (selectedTheme || store.profileData.userInfo.theme)['name'] ? 'active' : ''}`}
                  onClick={() => onSelectedTheme(item)}
                >
                  <View>{item['name']}</View>
                  {
                    item['name'] === (selectedTheme || store.profileData.userInfo.theme)['name'] && <View className="iconfont fs-24 jcon-seleted" style="color: #28bb56"></View> 
                  }
                </View>
              )
            })
          }
        </View>
      </Select>

    </View>
  )
})