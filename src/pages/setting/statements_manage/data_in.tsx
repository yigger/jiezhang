import { Component, useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import jz from '@/jz'
import BasePage from '@/components/BasePage'
import { Button } from '@/src/components/UiComponents'
import config from '@/src/config'
import Taro from '@tarojs/taro'

const LoginPc: React.FC = () => {
  const handleScan = async () => {
    const { result } = await Taro.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode']
    })
    const codeData = JSON.parse(result)
    await jz.api.users.loginPc(codeData.qr_code_id)
  }

  return (
    <BasePage
      headerName='登录PC端'
    >
      <View className='p-2'>
        <View>由于小程序端限制且操作麻烦，所以请登录PC端，然后扫码登录。</View>
        <View>PC端地址：{config.web_host}</View>
        <Button title="扫描网页端二维码" onClick={handleScan}></Button>
      </View>
    </BasePage>
  )
}

export default LoginPc