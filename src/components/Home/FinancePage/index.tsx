import { useState, useContext, useEffect } from 'react'
import { useDidShow } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import jz from '@/jz'
import AssetBanner from '@/components/AssetBanner'
import { observer } from 'mobx-react';
import { HomeStoreContext } from "@/src/stores"
import Avatar from '@/components/Avatar'

export const FinancePage = observer(() => {
  const store: HomeStoreContext = useContext(HomeStoreContext)
  const [shouldFetch, setShouldFetch] = useState(true);
  useEffect(() => {
    if (shouldFetch) {
      store.getFinanceData()
      setShouldFetch(false)
    }
  }, [shouldFetch]);
  useDidShow(() => {
    setShouldFetch(true);
  });

  const updateSecretAmount = async () => {
    store.updateFinanceAmountVisible()
  }

  return (
    <View className='jz-pages__finance'>
      <AssetBanner
        firstColumn={
          { title: '净资产', amount: store.financeData.header.net_worth }
        }
        secColumn={
          { title: '总资产', amount: store.financeData.header.total_asset }
        }
        thirdColumn={
          { title: '总负债', amount: store.financeData.header.total_liability }
        }
        amountVisible={store.financeData.amount_visible}
        updateSecretAmount={updateSecretAmount}
      />

      <View className='jz-pages__finance-list'>
        {store.financeData.list.map((asset) => (
          <View className='jz-pages__finance-list__item'>
            <View className='jz-pages__finance__child-total'>
              <Text className='asset-name'>{asset.name}</Text>
              <Text className='asset-amount'>￥{asset.amount}</Text>
            </View>
            {asset.childs.map(item => (
              <View 
                className='jz-pages__finance__child-list' 
                onClick={() => { 
                  jz.router.navigateTo({ 
                    url: `/pages/assets_flow/index?asset_id=${item.id}` 
                  }) 
                }}
              >
                <View className='d-flex flex-center'>
                  <View className='icon-wrapper'>
                    {item.icon_path ? (
                      <Image src={item.icon_path} className='asset-icon' />
                    ) : (
                      <Avatar 
                        text={item.name} 
                        backgroundColor='#1890ff'
                        size={40}
                      />
                    )}
                  </View>
                  <View className='asset-detail'>
                    <Text className='asset-name'>{item.name}</Text>
                    <Text className='asset-amount'>￥{item.amount}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}

        { store.financeData.payables && store.financeData.payables.childs.length > 0 &&
          <View className='jz-pages__finance-list__item'>
            <View className='jz-pages__finance__child-total'>
              <Text className='asset-name'>{store.financeData.payables.name}</Text>
              <Text className='asset-amount'>￥{store.financeData.payables.amount}</Text>
            </View>
            {store.financeData.payables.childs.map(item => (
              <View 
                className='jz-pages__finance__child-list' 
                onClick={() => {
                  jz.router.navigateTo({ url: `/pages/setting/chart/category_statement?category_id=${item.category_id}` })
                }}
              >
                <View className='d-flex flex-center'>
                  <View className='icon-wrapper'>
                    {item.icon_path ? (
                      <Image src={item.icon_path} className='asset-icon' />
                    ) : (
                      <Avatar 
                        text={item.name} 
                        backgroundColor='#1890ff'
                        size={40}
                      />
                    )}
                  </View>
                  <View className='asset-detail'>
                    <Text className='asset-name'>{item.name}</Text>
                    <Text className='asset-amount'>￥{item.amount}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        }

        { store.financeData.receivables && store.financeData.receivables.childs.length > 0 &&
          <View className='jz-pages__finance-list__item'>
            <View className='jz-pages__finance__child-total'>
              <Text className='asset-name'>{store.financeData.receivables.name}</Text>
              <Text className='asset-amount'>￥{store.financeData.receivables.amount}</Text>
            </View>
            {store.financeData.receivables.childs.map(item => (
              <View 
                className='jz-pages__finance__child-list' 
                onClick={() => { 
                  jz.router.navigateTo({ url: `/pages/setting/chart/category_statement?category_id=${item.category_id}` })
                }}
              >
                <View className='d-flex flex-center'>
                  <View className='icon-wrapper'>
                    {item.icon_path ? (
                      <Image src={item.icon_path} className='asset-icon' />
                    ) : (
                      <Avatar 
                        text={item.name} 
                        backgroundColor='#1890ff'
                        size={40}
                      />
                    )}
                  </View>
                  <View className='asset-detail'>
                    <Text className='asset-name'>{item.name}</Text>
                    <Text className='asset-amount'>￥{item.amount}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        }

      </View>
    </View>
  )
})