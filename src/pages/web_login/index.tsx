import WebSessionGate from '@/components/WebSessionGate'
import jz from '@/jz'
import { getWebReturnUrl } from '@/utils/web-session'
import Taro from '@tarojs/taro'
import { useCallback } from 'react'

export default function WebLoginPage() {
  const returnUrl = getWebReturnUrl(jz.router.getParams().returnTo)
  const onReady = useCallback(() => Taro.reLaunch({ url: returnUrl }), [returnUrl])
  return <WebSessionGate onReady={onReady} />
}
