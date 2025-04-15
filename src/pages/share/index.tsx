import React, { useEffect, useState } from 'react'
import Taro, { useShareAppMessage } from "@tarojs/taro"
import { View, Image, Checkbox } from '@tarojs/components'
import { AtCalendar, AtTag, AtCheckbox } from 'taro-ui'
import BasePage from '@/components/BasePage'
import { Button } from '@/src/components/UiComponents'
import jz from '@/jz'
import config from '../../config'

const SharePage: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [expendCategories, setExpendCategories] = useState<Array<any>>([])
  const [incomeCategories, setIncomeCategories] = useState<Array<any>>([])
  const [statements, setStatements] = useState<Array<any>>([])
  const [exceptedStatementIds, setExceptedStatementIds] = useState<string[]>([])
  
  useEffect(() => {
    // 获取分类列表
    const fetchCategories = async () => {
      const expendData = await jz.withLoading(jz.api.statements.categoriesWithForm('expend'))
      const incomeData = await jz.api.statements.categoriesWithForm('income')
      setExpendCategories(expendData.data)
      setIncomeCategories(incomeData.data)
      // 设置所有分类默认选中
      const allCategoryIds = [...expendData.data, ...incomeData.data].map(category => category.id)
      setSelectedCategories(allCategoryIds)
    }
    fetchCategories()
  }, [])

  const handleDateSelect = (date: { value: string }) => {
    if (!startDate) {
      setStartDate(date.value)
    } else if (!endDate && date.value > startDate) {
      setEndDate(date.value)
    } else {
      setStartDate(date.value)
      setEndDate('')
    }
  }

  const handleCategorySelect = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const handleSubmit = async () => {
    if (!startDate || !endDate || selectedCategories.length === 0) {
      jz.toastError('请选择日期范围和分类')
      return
    }
    // 重置状态
    setExceptedStatementIds([])
    const { data } = await jz.withLoading(jz.api.statements.list({
      start_date: startDate,
      end_date: endDate,
      category_ids: selectedCategories.join(',')
    }))
    if (data) {
      setStatements(data)
    }
  }

  const handleStatementCheck = (statementId: string) => {
    setExceptedStatementIds(prev => 
      prev.includes(statementId)
        ? prev.filter(id => id !== statementId)
        : [...prev, statementId]
    )
  }

  useShareAppMessage(async () => {
    const { data } = await jz.api.statements.generateShareToken({
      start_date: startDate,
      end_date: endDate,
      category_ids: selectedCategories.join(','),
      exceptedStatementIds: exceptedStatementIds.join(',')
    })
    const token = data.data['share_key']
    return {
      title: '记账账单分享',
      path: `/pages/share/public?token=${token}`,
      imageUrl: `${config.host}/logo.png`
    }
  })

  return (
    <BasePage
      headerName='分享账单给朋友'
    >
      <View className='share-page'>
        <View className='p-4'>
          <View>此页面可分享账单列表给朋友，选择日期范围以及分类，查询账单列表后点击右上角进行分享。</View>
          <View style={{color: 'red'}}>注：对方仅可看到你生成账单列表（即查询筛选出来的账单列表）</View>
        </View>
        <View className='bg-color-white'>
          <View className='date-range pt-4 pb-4'>
            <AtCalendar
              isMultiSelect 
              onDayClick={handleDateSelect}
              minDate='2017-01-01'
            />
            <View className='date-display'>
              时间范围：{startDate && `${startDate} 00:00:00 ~ ${endDate ?  `${endDate} 00:00:00` : '未选择结束时间'}`}
            </View>
          </View>

          <View className='categories'>
            <View className='ml-2 mb-2 fs-18'>支出</View>
            {expendCategories.map(category => (
              <AtTag
                key={category.id}
                name={category.name}
                className=' ml-2 mb-2'
                active={selectedCategories.includes(category.id)}
                onClick={() => handleCategorySelect(category.id)}
              >
                {category.name}
              </AtTag>
            ))}

            <View className='ml-2 mb-2 fs-18'>收入</View>
            {incomeCategories.map(category => (
              <AtTag
                key={category.id}
                name={category.name}
                className=' ml-2 mb-2'
                active={selectedCategories.includes(category.id)}
                onClick={() => handleCategorySelect(category.id)}
              >
                {category.name}
              </AtTag>
            ))}
          </View>
        </View>

        <View>
          <Button
            title='查询账单'
            onClick={handleSubmit}
          />
        </View>
        
        {statements.length > 0 && (
          <View>
            <View>勾选账单后，点击右上角"..."，发送给朋友</View>
            <View>
              { 
                statements.map((statement) => {
                  return (
                    <View className={`statement-component__item ${statement.type}`} key={statement.id}>
                      <View className='d-flex pb-3 pt-3 flex-between flex-center'>
                        <View className='mr-2'>
                          <Checkbox
                            value={statement.id}
                            checked={!exceptedStatementIds.includes(statement.id)}
                            onClick={() => handleStatementCheck(statement.id)}
                          />
                        </View>

                        <View className='d-flex flex-1 pb-3 pt-3 flex-between flex-center' onClick={() => { jz.router.navigateTo({ url: `/pages/statement_detail/index?statement_id=${statement.id}` }) }}>
                          <View className='d-flex flex-1 flex-center'>
                            <View className='statement-component__icon-image'>
                              <Image src={statement.icon_path}></Image>
                            </View>
                            <View className='flex-1 ml-4'>
                              <View className='fs-14 col-text pb-1'>{statement.category}</View>
                              { statement.description && (<View className='fs-12 col-text-mute'>{statement.description}</View> )}
                              <View className='fs-12 col-text-mute'>{statement.timeStr}</View>
                            </View>
                          </View>

                          <View className='d-flex flex-center-center flex-column'>
                            <View className={`col-${statement.type}`}>{statement.money}</View>
                          </View>
                        </View>
                      </View>
                    </View>
                  )})
              }
            </View>
          </View>
        )}

        {statements.length > 0 && <Button title="分享给朋友" openType='share' />}
      </View>
    </BasePage>
  )
}

export default SharePage