import type * as ApiTypes from '@/api/types'
import BasePage from '@/components/BasePage'
import EmptyTips from '@/components/EmptyTips'
import jz from '@/jz'
import { View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { runTask } from '../../../utils/async'

const MessagePage: React.FC = () => {
  const [messages, setMessages] = useState<ApiTypes.MessageListItem[]>([])

  const getMessages = async () => {
    const { data } = await jz.api.messages.getList()
    setMessages(data)
  }

  useEffect(() => {
    runTask(getMessages())
  }, [])

  return (
    <BasePage headerName="站内消息">
      <View>
        {messages.length === 0 && <EmptyTips content="暂无消息"></EmptyTips>}
        {messages.map((message) => {
          return (
            <View
              key={message.id}
              className="bg-color-white jz-border-bottom-1 p-4"
              onClick={() => {
                runTask(
                  jz.router.navigateTo({
                    url: `/pages/setting/messages/detail?messageId=${message.id}`
                  })
                )
              }}
            >
              <View className="pt-2 pb-2">{message.title}</View>
              <View className="col-text-mute d-flex flex-between">
                <View>{message.msg_type}</View>
                <View>{message.time}</View>
              </View>
            </View>
          )
        })}
      </View>
    </BasePage>
  )
}

export default MessagePage
