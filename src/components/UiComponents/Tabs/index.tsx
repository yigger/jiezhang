import { ScrollView, View } from '@tarojs/components'

export const Tabs = <T extends string | number>({
  tabs,
  current,
  onChange
}: {
  tabs: { id: T; title: string; type?: string }[]
  current: T
  onChange: (id: T) => void
}) => {
  return (
    <ScrollView scrollX className="jz-common-components__tab" enhanced showScrollbar={false}>
      <View className="d-flex">
        {tabs.map((item) => {
          return (
            <View
              key={item.id}
              className={`item d-flex flex-center-center p-2 ${item.type} ${current === item.id ? 'active' : ''}`}
              onClick={() => onChange(item.id)}
            >
              {item.title}
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}
