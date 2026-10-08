import jz from '@/jz'
import { Button } from '@/src/components/UiComponents'
import { defaultHomeTabIDs, homeTabs, moveHomeTab } from '@/utils/home-tabs'
import { ScrollView, Switch, View } from '@tarojs/components'
import { useState } from 'react'
import '@/src/styles'

export default function HomeTabSettings({ onClose }: { onClose: () => void }) {
  const [enabled, setEnabled] = useState(() => jz.storage.getHomeTabs())
  const [order, setOrder] = useState(() => [
    ...enabled,
    ...defaultHomeTabIDs.filter((id) => !enabled.includes(id))
  ])
  const [error, setError] = useState('')
  const save = () => {
    try {
      jz.storage.setHomeTabs(order.filter((id) => enabled.includes(id)))
      jz.event.emit('home-tabs:updated')
      onClose()
    } catch {
      setError('设置保存失败，请重试')
    }
  }
  return (
    <View className="spending-details">
      <View className="spending-details__mask" onClick={onClose} />
      <View className="spending-details__panel">
        <View className="spending-analysis__heading">
          <View>自定义底部导航</View>
          <View className="spending-analysis__link" onClick={onClose}>
            取消
          </View>
        </View>
        <View className="spending-analysis__muted">
          选择显示的入口，用上移／下移调整顺序。首页和我的保留入口，设置保存在本机。
        </View>
        <ScrollView scrollY className="spending-details__list">
          {order.map((id, index) => {
            const tab = homeTabs.find((t) => t.page === id)
            if (!tab) return null
            return (
              <View className="spending-analysis__category" key={id}>
                <View className="spending-analysis__heading">
                  <View>{tab.name}</View>
                  <Switch
                    checked={enabled.includes(id)}
                    disabled={id === 'index' || id === 'profile'}
                    onChange={(e) =>
                      setEnabled((v) => (e.detail.value ? [...v, id] : v.filter((p) => p !== id)))
                    }
                  />
                </View>
                <View className="spending-analysis__profile">
                  {index > 0 && (
                    <View
                      className="spending-analysis__link"
                      onClick={() => setOrder((v) => moveHomeTab(v, id, -1))}
                    >
                      上移
                    </View>
                  )}
                  {index < order.length - 1 && (
                    <View
                      className="spending-analysis__link"
                      onClick={() => setOrder((v) => moveHomeTab(v, id, 1))}
                    >
                      下移
                    </View>
                  )}
                </View>
              </View>
            )
          })}
          <Button
            title="恢复默认"
            onClick={() => {
              setEnabled([...defaultHomeTabIDs])
              setOrder([...defaultHomeTabIDs])
            }}
          />
          {error && <View>{error}</View>}
          <Button title="保存导航" onClick={save} />
        </ScrollView>
      </View>
    </View>
  )
}
