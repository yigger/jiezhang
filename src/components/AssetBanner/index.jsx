import React from 'react'
import { View, Text } from '@tarojs/components'

const AssetBanner = ({
  firstColumn={},
  secColumn={},
  thirdColumn={},
  amountVisible=false,
  updateSecretAmount=null
}) => {
  return (
    <View className='asset-banner-component'>
      <View className='banner-card'>
        <View className='banner-main'>
          <View className='banner-title'>
            <Text className='title'>{firstColumn['title']}</Text>
            <View className='visibility-toggle' onClick={updateSecretAmount}>
              {!amountVisible ? (
                <View className='toggle-btn'>
                  <Text className='iconfont jcon-eye'></Text>
                  <Text className='toggle-text'>显示数额</Text>
                </View>
              ) : (
                <View className='toggle-btn'>
                  <Text className='iconfont jcon-eye-close'></Text>
                  <Text className='toggle-text'>隐藏数额</Text>
                </View>
              )}
            </View>
          </View>
          <View className='banner-amount'>
            <Text className='amount-prefix'>￥</Text>
            <Text className='amount-value'>{firstColumn['amount']}</Text>
          </View>
        </View>

        <View className='banner-footer'>
          <View className='footer-item'>
            <Text className='item-label'>{secColumn['title']}</Text>
            <Text className='item-value'>￥{secColumn['amount']}</Text>
          </View>
          <View className='footer-item'>
            <Text className='item-label'>{thirdColumn['title']}</Text>
            <Text className='item-value'>￥{thirdColumn['amount']}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default AssetBanner