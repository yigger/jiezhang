import EmptyNoData from '@/assets/images/empty_no_data.png'
import { Image, View } from '@tarojs/components'

export default function EmptyTips({ content = '查无数据' }: { content?: string } = {}) {
  return (
    <View className="empty-tips-component text-align-center m-4">
      <Image style="width: 140px; height: 120px" src={EmptyNoData}></Image>
      <View className="fs-12">{content}</View>
    </View>
  )
}
