import React from 'react'
import { View, Image, Text } from '@tarojs/components'
import { Loading } from '@/src/components/UiComponents'
import Avatar from '@/components/Avatar'

export default function CategorySelect({
  title,
  data,
  frequent,
  handleClick,
  setActive,
  loading
}) {
  return (
    <View className='category-select'>
      <View className='category-select__mask' onClick={() => setActive(false)} />
      
      <View className='category-select__container'>
        <View className='category-select__header'>
          <View className='category-select__title'>{ title }</View>
        </View>
        
        <View className='category-select__content'>
          {loading ? (
            <View className='category-select__loading'>
              <Loading active={true} />
            </View>
          ) : (
            <>
              {frequent && frequent.length > 0 && (
                <CategoryContent
                  title='常用分类'
                  data={frequent}
                  handleClick={handleClick}
                />
              )}

              {data.map((item) => (
                <CategoryContent
                  key={item.id}
                  title={item.name}
                  parent={item}
                  data={item.childs}
                  handleClick={handleClick}
                />
              ))}
            </>
          )}
        </View>
      </View>
    </View>
  )
}

function CategoryContent({ title, data, handleClick, parent = null }) {
  return (
    <View className='category-content'>
      <View className='category-content__header'>
        <Text className='category-content__title'>{title}</Text>
        <Text className='category-content__count'>({data.length})</Text>
      </View>
      
      <View className='category-content__grid'>
        {data.map((item) => (
          <View 
            key={item.id}
            className='category-item'
            onClick={(e) => handleClick(e, parent || item?.parent, item)}
          >
            <View className='category-item__icon'>
              {item.icon_path ? (
                <Image src={item.icon_path} mode='aspectFit' />
              ) : (
                <Avatar 
                  text={item.name} 
                  backgroundColor='#e74c3c'
                />
              )}
            </View>
            <View className='category-item__name'>{item.name}</View>
          </View>
        ))}
      </View>
    </View>
  )
}
