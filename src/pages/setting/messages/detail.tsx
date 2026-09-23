import type * as ApiTypes from '@/api/types'
import BasePage from '@/components/BasePage'
import jz from '@/jz'
import { safeRichText } from '@/utils/rich-text'
import { RichText, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { runTask } from '../../../utils/async'

const MessageDetail: React.FC = () => {
  const [message, setMessage] = useState<Partial<ApiTypes.MessageDetailItem>>({})

  const getMessage = async () => {
    const params = jz.router.getParams()
    const messageId = params.messageId ?? ''
    const { data } = await jz.api.messages.getMessage(messageId)
    setMessage(data)
  }

  useEffect(() => {
    runTask(getMessage())
  }, [])

  const contentStyle = {
    background: 'white !important'
  }

  return (
    <BasePage headerName="消息详情" contentStyle={contentStyle}>
      <View className="at-article bg-color-white">
        <View className="at-article__h1">{message.title}</View>
        <View className="at-article__info">
          {message.msg_type}&nbsp;&nbsp;&nbsp;{message.time}
        </View>
        <View className="at-article__content">
          <View className="at-article__section">
            <RichText nodes={safeRichText(message.content ?? '')} />
          </View>
        </View>
      </View>
    </BasePage>
  )
}

export default MessageDetail
