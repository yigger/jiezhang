import type * as ApiTypes from '@/api/types'
import BasePage from '@/components/BasePage'
import { Button } from '@/src/components/UiComponents'
import Statements from '@/components/Statements'
import jz from '@/jz'
import { Input, View } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import { runTask } from '../../../utils/async'

const Search: React.FC = () => {
  const searchVersion = useRef(0)
  const [keyword, setKeyword] = useState('')
  const [retryVersion, setRetryVersion] = useState(0)
  const [status, setStatus] = useState('idle')
  const [statements, setStatements] = useState<ApiTypes.StatementListItem[]>([])

  useEffect(() => {
    let active = true
    const version = ++searchVersion.current
    const query = keyword.trim()
    if (!query) {
      setStatus('idle')
      setStatements([])
      return
    }
    setStatus('loading')
    const timer = setTimeout(() => {
      runTask(
        jz.api.statements
          .searchStatements(query)
          .then(({ data }) => {
            if (!active || version !== searchVersion.current) return
            setStatements(data)
            setStatus('ready')
          })
          .catch((error: unknown) => {
            if (active && version === searchVersion.current) setStatus('error')
            throw error
          })
      )
    }, 300)
    return () => {
      clearTimeout(timer)
      active = false
    }
  }, [keyword, retryVersion])

  return (
    <BasePage headerName="账单搜索">
      <View className="jz-component__input">
        <Input
          name="value"
          type="text"
          placeholder="请输入关键字, 支持搜索金额、地址、备注"
          value={keyword}
          onInput={(e) => {
            setKeyword(e.detail.value)
          }}
        />
      </View>

      <View className="p-4">
        {status === 'idle' && '输入金额、地址或备注查找账单'}
        {status === 'loading' && '正在搜索…'}
        {status === 'error' && (
          <View>
            搜索失败，请重试
            <Button
              title="重新搜索"
              className="primary"
              onClick={() => setRetryVersion((current) => current + 1)}
            />
          </View>
        )}
        {status === 'ready' &&
          (statements.length === 0 ? (
            '没有找到，试试其他关键词'
          ) : (
            <Statements statements={statements} />
          ))}
      </View>
    </BasePage>
  )
}

export default Search
