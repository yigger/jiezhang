
import { View } from '@tarojs/components'
import jz from '@/jz'
import { useEffect, useState } from 'react'
import BasePage from '@/components/BasePage'
import { AtInput }  from 'taro-ui'
import { Button } from '@/src/components/UiComponents'
import { toInteger } from 'lodash'
import Taro from "@tarojs/taro"

export default function BudgetFormPage () {
  const [amount, setAmount] = useState(0)
  const params = jz.router.getParams()

  useEffect(() => {
    setAmount(toInteger(params.amount))
  }, [])

  const submit = async () => {
    Taro.showLoading({
      title: 'loading',
    })
    const {data} = Number(params.id) === 0 ? (await jz.api.budgets.updateRootAmount({amount: amount})) : (await jz.api.budgets.updateCategoryAmount({category_id: params.category_id, amount: amount}))
    Taro.hideLoading()
    if (data.status === 500) {
      jz.toastError(data.msg)
    } else {
      jz.router.navigateBack()
    }
  }

  return (
    <BasePage
      headerName='预算设置'
    >
      <View className='jz-pages__budget'>
        <AtInput
          title="预算金额"
          name='value'
          type='number'
          placeholder='输入预算金额'
          value={amount}
          onChange={(value) => setAmount(value) }
        />
        <Button title='提交' onClick={submit}></Button>
      </View>
    </BasePage>
  )
}