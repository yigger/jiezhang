import { useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import jz from '@/jz'
import BasePage from '@/components/BasePage'

const MessageDetail: React.FC = () => {
  const [message, setMessage] = useState({})

  const getMessage = async () => {
    const params = jz.router.getParams()
    const messageId = params.messageId
    const { data } = await jz.api.messages.getMessage(messageId)
    setMessage(data)
  }

  useEffect(() => {
    getMessage()
  }, [])

  const contentStyle = {
    background: "white !important"
  }

  return (
    <BasePage
      headerName='消息详情'
      contentStyle={contentStyle}
    >
      <View className='at-article bg-color-white'>
        <View className='at-article__h1'>
          {message.title}
        </View>
        <View className='at-article__info'>
          {message.msg_type}&nbsp;&nbsp;&nbsp;{message.time}
        </View>
        <View className='at-article__content'>
          <View className='at-article__section'>
            <View dangerouslySetInnerHTML={{ __html: message.content }}></View>
          </View>
        </View>
      </View>

    </BasePage>
  )
}

export default MessageDetail