import { View } from '@tarojs/components'

export default function Select ({
  children,
  onSubmit,
  onCancel,
  onToggle,
  permitCloseMask=true,
  title='标题',
  open=false
}) {
  const cancelBtn = () => {
    if (typeof onCancel === 'function') {
      onCancel()
    }
    onToggle()
  }

  const okBtn = () => {
    if (typeof onSubmit === 'function') {
      onSubmit()
    }
  }

  if (!open) {
    return 
  }

  return (
    <View className="select-component">
      <View className='select__mask' onClick={() => { permitCloseMask && onToggle() }}></View>
      <View className='select__main'>
        <View className='select__main-title fs-14'>
          {title}
        </View>
        <View className='select__main-content'>
          {children}
        </View>

        <View className='button-group d-flex flex-between m-6'>
          <View className='btn cancel-btn flex-1 mr-4 text-align-center' onClick={()=>cancelBtn()}>取消</View>
          <View className='btn ok-btn flex-1 ml-4 text-align-center' onClick={()=>okBtn()}>确认</View>
        </View>
      </View>
    </View>
  )
}