import { useState } from 'react'
import { View, Input } from '@tarojs/components'
import jz from '@/jz'
import BasePage from '@/components/BasePage'
import Statements from '@/components/Statements'

const Search: React.FC = () => {
  const [keyword, setKeyword] = useState('')
  const [statements, setStatements] = useState([])
  
  const onChange = async (keyword) => {
    setKeyword(keyword)
    const {data} = await jz.api.statements.searchStatements(keyword)
    if (data.status === 404) {
      setStatements([])
    } else {
      setStatements(data)
    }
  }

  return (
    <BasePage
      headerName='账单搜索'
    >
      <View className='jz-component__input'>
        <Input
          name='value'
          type='text'
          placeholder='请输入关键字, 支持搜索金额、地址、备注'
          value={keyword}
          onInput={(e) => { onChange(e.detail.value) }}
        />
      </View>

      <View className='p-4'>
        { statements.length === 0 ? '未找到相应账单' : <Statements statements={statements}></Statements> }
      </View>
    </BasePage>
  )
}

export default Search