import React from 'react'
import { View, Image, Text } from '@tarojs/components'
import Avatar from '@/components/Avatar'
import jz from '@/jz'

const moodTags = [
  { name: '开心', color: '#52c41a' },  // 绿色，积极正面的心情
  { name: '纠结', color: '#1890ff' },  // 蓝色，表示思考和犹豫
  { name: '后悔', color: '#ff4d4f' },  // 红色，表示负面情绪
  { name: '无奈', color: '#faad14' },  // 黄色，表示中性情绪
  { name: '郁闷', color: '#722ed1' },  // 紫色，表示低落的情绪
  { name: '生气', color: '#f5222d' }   // 深红色，表示强烈的负面情绪
]

const isTheYear = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
}

const getColorClass = (type) => {
  switch(type) {
    case 'income':
    case 'loan_in':
      return 'income';
    case 'transfer':
      return 'transfer';
    default:
      return 'expend';
  }
}

const getMoodColor = (mood) => {
  const moodTag = moodTags.find(tag => tag.name === mood)
  return moodTag?.color || '#52c41a' // 默认使用"开心"的颜色
}

export default function Statement({ statement, editable = true }) {
  return (
    <View className={`statement-component__item ${statement.type}`}>
      <View className='d-flex pb-3 pt-3 flex-between flex-center' onClick={() => { editable && jz.router.navigateTo({ url: `/pages/statement_detail/index?statement_id=${statement.id}` }) }}>
        <View className='d-flex flex-1 flex-center'>
          <View className='statement-component__icon-image'>
            {statement.icon_path ? (
              <Image src={statement.icon_path} />
            ) : (
              <Avatar 
                text={statement.category} 
                backgroundColor={['income', 'loan_in'].includes(statement.type) ? '#e74c3c' : '#2ecc71'}
              />
            )}
          </View>
          <View className='flex-1 ml-4'>
            <View className='d-flex flex-center pb-1'>
              {statement.target_object && (
                <View className={`fs-12 target-object ${statement.type}`}>{statement.target_object}</View>
              )}
              <Text className='fs-14 col-text text-ellipsis'>{statement.category}</Text>
              {statement.mood && (
                <Text className='fs-12 ml-2 mood-tag' style={{ background: getMoodColor(statement.mood) }}>
                  {statement.mood}
                </Text>
              )}
            </View>
            <View className='description-wrapper'>
              
              <View className='d-flex flex-center'>
                {statement.description && (
                  <Text className='fs-12 col-text-mute text-ellipsis'>{statement.description}</Text>
                )}
              </View>
            </View>
            
            <View className='d-flex flex-center fs-12 col-text-mute'>
              <Text>{isTheYear(statement.date) ? statement.timeStr : statement.date}</Text>
              {
                statement.payee && (
                  <Text className='fs-12 col-text-mute text-ellipsis'>·{statement.payee.name}</Text>
                )
              }
              {statement.has_pic && (
                <Text className='fs-18 ml-1 iconfont jcon-pic1 col-text-mute'></Text>
              )}
              
              
              {/* {statement.location && (
                <Text className='ml-2'>📍 {statement.location}</Text>
              )} */}
            </View>
          </View>
        </View>

        <View className='d-flex flex-center-center flex-column'>
          <View className={`col-${getColorClass(statement.type)}`}>{statement.money}</View>
          {statement.tags && statement.tags.length > 0 && (
            <View className='fs-10 col-text-mute mt-1'>{statement.tags.join(' · ')}</View>
          )}
        </View>
      </View>
    </View>
  )
}
