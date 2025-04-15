import { Component, useEffect, useState } from 'react'
import { View, Image } from '@tarojs/components'
import jz from '@/jz'
import BasePage from '@/components/BasePage'
import Statements from '@/components/Statements'
import { AtTextarea }  from 'taro-ui'
import { Button } from '@/src/components/UiComponents'

const Feedback: React.FC = () => {
  const [text, setText] = useState("")

  const submit = async () => {
    jz.api.chaos.submitFeedback({content: text})
    jz.router.navigateBack()
  }

  return (
    <BasePage
      headerName='意见反馈'
    >
      <View>
        <View className='p-4'>
          感谢您的支持与反馈，如有需要可以微信联系我sheepzom，或者也可以在此写下您的建议，谢谢你的使用。 
        </View>
        <AtTextarea
          value={text}
          onChange={(t) => setText(t)}
          placeholder='在此写下您的反馈...'
        />
      </View>

      <Button title="提交" onClick={submit}></Button>

    </BasePage>
  )
}

export default Feedback