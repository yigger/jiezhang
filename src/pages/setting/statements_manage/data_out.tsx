import { useState } from 'react'
import { View } from '@tarojs/components'
import { AtButton, AtList, AtListItem } from 'taro-ui'
import jz from '@/jz'
import BasePage from '@/components/BasePage'
import Taro from '@tarojs/taro'

type ExportRange = '1month' | '3months' | 'all'

export default function ExportIndex(): JSX.Element {
  const [selectedRange, setSelectedRange] = useState<ExportRange>('1month')
  const rangeOptions = [
    { value: '1month', label: '近1个月' },
    { value: '3months', label: '近3个月' },
    { value: 'all', label: '全部' }
  ]

  const handleExport = async () => {
    try {
      // 先检查是否超过导出限制
      const { data } = await jz.api.statements.pre_check_export(selectedRange)
      if (data.status !== 200) {
        jz.toastError(data.msg || '无法导出，联系管理员')
        return
      }

      const res = await jz.withLoading(jz.api.statements.export_excel(selectedRange))
      if (res.statusCode === 200) {
        const filePath = res.tempFilePath
        try {
          // 保存文件到本地
          const saveRes = await Taro.saveFile({
            tempFilePath: filePath
          })
          
          // 打开文件
          await Taro.openDocument({
            filePath: saveRes.savedFilePath,
            fileType: 'xlsx',
            showMenu: true
          })
          
          Taro.showToast({
            title: '文件已保存到本地',
            icon: 'success'
          })
        } catch (error) {
          jz.toastError('文件保存失败')
        }
      }
    } catch (error) {
      jz.toastError('导出失败')
    }
  }

  return (
    <BasePage headerName='账单导出'>
      <View className='p-4 export_pages'>
        <View className='mb-4'>选择导出范围：</View>
        <AtList>
          {rangeOptions.map(option => (
            <AtListItem
              key={option.value}
              title={option.label}
              className={selectedRange === option.value ? 'item-selected' : ''}
              onClick={() => setSelectedRange(option.value as ExportRange)}
            />
          ))}
        </AtList>
        
        <View className='col-text-warn'>**每天仅能导出 5 次！</View>
        <View className='col-text-warn'>**导出后自动打开文档，请自行保存。</View>
        <View className='col-text-warn'>**最多仅支持导出 3000 条数据</View>

        <View className='mt-4'>
          <AtButton
            type='primary'
            onClick={handleExport}
          >
            导出账单
          </AtButton>
        </View>
      </View>
    </BasePage>
  )
}