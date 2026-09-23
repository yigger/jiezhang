import type * as ApiTypes from '@/api/types'
import BasePage from '@/components/BasePage'
import Statements from '@/components/Statements'
import jz from '@/jz'
import { Input, View } from '@tarojs/components'
import { useRef, useState } from 'react'
import { runTask } from '../../../utils/async'

const Search: React.FC = () => {
  const searchVersion = useRef(0)
  const [keyword, setKeyword] = useState('')
  const [statements, setStatements] = useState<ApiTypes.StatementListItem[]>([])

  const onChange = async (keyword: string) => {
    const version = ++searchVersion.current
    setKeyword(keyword)
    const { data } = await jz.api.statements.searchStatements(keyword)
    if (version === searchVersion.current) setStatements(data)
  }

  return (
    <BasePage headerName="账单搜索">
      <View className="jz-component__input">
        <Input
          name="value"
          type="text"
          placeholder="请输入关键字, 支持搜索金额、地址、备注"
          value={keyword}
          onInput={(e) => {
            runTask(onChange(e.detail.value))
          }}
        />
      </View>

      <View className="p-4">
        {statements.length === 0 ? (
          '未找到相应账单'
        ) : (
          <Statements statements={statements}></Statements>
        )}
      </View>
    </BasePage>
  )
}

export default Search
