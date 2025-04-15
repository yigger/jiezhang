import Taro from '@tarojs/taro'
import { View } from "@tarojs/components"
import BasePage from '@/components/BasePage'
import { Button } from '@/src/components/UiComponents'
import { HomeStoreContext } from "@/src/stores"
import { useEffect, useState, useContext } from "react"
import jz from '@/jz'
import { format } from 'date-fns'

import './list.styl'

const AccountBookList = () => {
  const [accountBooks, setAccountBooks] = useState([])
  const homeStore: HomeStoreContext = useContext(HomeStoreContext)

  const getAccountBooks = async () => {
    Taro.showLoading()
    const { data } = await jz.api.account_books.getAccountBooks()
    Taro.hideLoading()
    setAccountBooks(data)
  }

  useEffect(() => {
    getAccountBooks()
  }, [])

  return (
    <BasePage
      headerName='账簿列表'
    >
      <View className='account-list'>
        {
          accountBooks.map((account_book) => {
            return (
              <View className={`account m-4 ${account_book.id === homeStore.currentAccountBook?.id ? 'active' : ''}`} onClick={() => jz.router.navigateTo({ url: `/pages/account_books/edit?id=${account_book.id}` })}>
                <View className='d-flex p-4'>
                  <View className='flex-1'>
                    <View className='d-flex mb-2 flex-between'>
                      <View>{ account_book.name }</View>
                      <View>{ account_book.account_type_name }</View>
                    </View>
                    <View className=' fs-14 mb-2' style="min-height: 24PX">{ account_book.description }</View>
                    <View className='d-flex fs-14 mb-2 flex-between'>
                      <View>创建者 { account_book.user?.nickname }</View>
                      <View>{ format(new Date(account_book.created_at), 'yyyy-MM-dd') }</View>
                    </View>
                  </View>
                </View>
              </View>
            )
          })
        }
      </View>

      <View>
        <Button title='创建账簿' onClick={() =>  jz.router.navigateTo({ url: '/pages/account_books/create' }) }></Button>
      </View>
    </BasePage>
  )
}

export default AccountBookList