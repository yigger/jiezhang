import { View, Text } from '@tarojs/components'
import jz from '@/jz'
import { Loading } from '@/src/components/UiComponents'

type PayeeSelectProps = {
  title?: string
  handleClick: (tag: any) => void
  data: any[]
  setActive: (active: boolean) => void
  loading?: boolean
}

export default function PayeeSelect({
  title = '选择商家',
  handleClick,
  data,
  setActive,
  loading = false
}: PayeeSelectProps) {
  return (
    <View className='statement-form__category-select'>
      <View className='category-select__mask' onClick={() => setActive(false)} />
      <View className='category-select__main animate__animated animate__fadeInUp'>
        <View className='category-select__main-title d-flex flex-between flex-center'>
          <Text>{title}</Text>
          <Text 
            className='col-primary' 
            onClick={(e) => {
              e.stopPropagation()
              jz.router.navigateTo({url: '/pages/payee/list'})
            }}
          >
            管理商家
          </Text>
        </View>
        <View className='category-select__main-content'>
          {loading ? (
            <View className='loading-wrapper'>
              <Loading active={true} />
            </View>
          ) : data.length === 0 ? (
            <View className='empty-wrapper d-flex flex-center-center flex-column'>
              <Text className='empty-text'>还没有商家记录</Text>
              <Text 
                className='empty-action col-primary mt-2'
                onClick={() => jz.router.navigateTo({url: '/pages/payee/list'})}
              >
                去添加
              </Text>
            </View>
          ) : (
            data.map((tag) => (
              <View
                key={tag.id}
                className='f-column d-flex p-4 flex-between flex-center'
                onClick={() => handleClick(tag)}
              >
                <Text>{tag.name}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  )
}