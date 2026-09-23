import { isRecord } from '@/api/http-result'
import BasePage from '@/components/BasePage'
import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import config from '@/src/config'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { guardEvent } from '../../../utils/async'

const LoginPc: React.FC = () => {
  const handleScan = async () => {
    const { result } = await Taro.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode']
    })
    const codeData: unknown = JSON.parse(result)
    if (
      !isRecord(codeData) ||
      typeof codeData.qr_code_id !== 'string' ||
      !codeData.qr_code_id.trim()
    ) {
      throw new Error('请扫描网页端的登录二维码')
    }
    await jz.api.users.loginPc(codeData.qr_code_id)
  }

  return (
    <BasePage headerName="登录PC端">
      <View className="p-2">
        <View>由于小程序端限制且操作麻烦，所以请登录PC端，然后扫码登录。</View>
        <View>PC端地址：{config.web_host}</View>
        <Button title="扫描网页端二维码" onClick={guardEvent(handleScan)}></Button>
      </View>
    </BasePage>
  )
}

export default LoginPc
