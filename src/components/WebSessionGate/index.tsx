import { RequestManager, WEB_AUTH_REQUIRED } from '@/api/request'
import jz from '@/jz'
import config from '@/src/config'
import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useCallback, useEffect, useRef, useState } from 'react'
import '@/src/styles'
import './index.scss'

interface WebSessionGateProps {
  onReady: () => Promise<unknown>
}

export default function WebSessionGate({ onReady }: WebSessionGateProps) {
  const [checking, setChecking] = useState(true)
  const [session, setSession] = useState('')
  const [error, setError] = useState('')
  const mounted = useRef(false)
  const busy = useRef(false)
  const development = config.web_auth_mode === 'development'

  const initialize = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setChecking(true)
    setError('')
    try {
      await jz.initialize()
      if (mounted.current) {
        setSession('')
        await onReady()
      }
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : '无法连接服务，请稍后重试')
      }
    } finally {
      busy.current = false
      if (mounted.current) setChecking(false)
    }
  }, [onReady])

  useEffect(() => {
    mounted.current = true
    const requireLogin = () => {
      setError('登录已失效，请重新提供有效的 Session')
    }
    Taro.eventCenter.on(WEB_AUTH_REQUIRED, requireLogin)
    if (development || RequestManager.getStoredSession(jz.apiUrl, jz.appId)) {
      void initialize()
    } else {
      setChecking(false)
    }
    return () => {
      mounted.current = false
      Taro.eventCenter.off(WEB_AUTH_REQUIRED, requireLogin)
    }
  }, [development, initialize])

  const login = async () => {
    if (busy.current) return
    if (!session.trim()) {
      setError('请输入登录 Session')
      return
    }
    try {
      RequestManager.saveSession(jz.apiUrl, jz.appId, session)
      await initialize()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法保存登录 Session')
    }
  }

  return (
    <View className="web-session-gate">
      <View className="web-session-card">
        <Text className="web-session-title">洁账</Text>
        <View className="mb-4">
          {checking
            ? '正在连接服务…'
            : development
              ? '连接本地开发服务后，即可使用测试账簿。'
              : '使用后端签发的有效 Session 登录。'}
        </View>
        {!development && !checking && (
          <Input
            password
            value={session}
            placeholder="请输入登录 Session"
            onInput={(event) => setSession(event.detail.value)}
            onConfirm={() => void login()}
          />
        )}
        {error && <View className="web-session-error">{error}</View>}
        <Button
          disabled={checking}
          loading={checking}
          onClick={() => void (development ? initialize() : login())}
        >
          {checking ? '连接中' : development ? '重新连接' : '登录'}
        </Button>
      </View>
    </View>
  )
}
