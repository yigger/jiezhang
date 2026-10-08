import { Input, View } from '@tarojs/components'
import { useState } from 'react'
import {
  PROJECT_ICONS,
  PROJECT_ICON_LABELS,
  PROJECT_COLORS,
  projectAppearance
} from '@/utils/project-appearance'
import '@/src/styles'
export default function AppearancePicker({
  icon,
  color,
  onIcon,
  onColor
}: {
  icon: string
  color: string
  onIcon: (icon: string) => void
  onColor: (color: string) => void
}) {
  const [query, setQuery] = useState('')
  const [all, setAll] = useState(false)
  const [limit, setLimit] = useState(60)
  const appearance = projectAppearance({ icon, color })
  const keyword = query.trim().toLowerCase()
  const candidates = (keyword || all ? PROJECT_ICONS : Object.keys(PROJECT_ICON_LABELS)).filter(
    (id) => !keyword || `${PROJECT_ICON_LABELS[id] || ''} ${id}`.toLowerCase().includes(keyword)
  )
  return (
    <View className="project-appearance">
      <View className="project-appearance__preview">
        <View
          className={`project-appearance__preview-icon iconfont ${appearance.icon}`}
          style={{ color: appearance.color, background: appearance.tint }}
        />
        <View>
          项目图标与颜色<View className="project-appearance__hint">选择后卡片与详情会同步显示</View>
        </View>
      </View>
      <View className="project-appearance__colors">
        {PROJECT_COLORS.map((c) => (
          <View
            key={c.color}
            onClick={() => onColor(c.color)}
            className={`project-appearance__color ${c.color.toLowerCase() === color.toLowerCase() ? 'is-selected' : ''}`}
          >
            <View style={{ background: c.color }}>
              {c.color.toLowerCase() === color.toLowerCase() ? '✓' : ''}
            </View>
            <View>{c.name}</View>
          </View>
        ))}
      </View>
      <View className="project-appearance__custom">
        <View>自定义颜色</View>
        <Input
          value={color}
          maxlength={7}
          placeholder="#287454"
          onInput={(e) => onColor(e.detail.value)}
        />
      </View>
      <Input
        className="project-appearance__search"
        value={query}
        placeholder="搜索图标：中文常用名称 / 英文"
        onInput={(e) => {
          setQuery(e.detail.value)
          setLimit(60)
        }}
      />
      <View className="project-appearance__icons">
        {candidates.slice(0, limit).map((id) => (
          <View
            key={id}
            className={`project-appearance__icon ${icon === id ? 'is-selected' : ''}`}
            onClick={() => onIcon(id)}
            style={
              icon === id
                ? {
                    color: appearance.color,
                    background: appearance.tint,
                    borderColor: appearance.color
                  }
                : undefined
            }
          >
            <View className={`iconfont ${id}`} />
            <View>{(PROJECT_ICON_LABELS[id] || id.replace('jcon-', '')).split(' ')[0]}</View>
            {icon === id && <View className="project-appearance__check">✓</View>}
          </View>
        ))}
      </View>
      {!candidates.length && <View className="project-appearance__hint">没有找到匹配的图标</View>}
      {candidates.length > limit && (
        <View className="project-appearance__more" onClick={() => setLimit((v) => v + 60)}>
          显示更多图标（{candidates.length} 个）
        </View>
      )}
      {!query && (
        <View
          className="project-appearance__more"
          onClick={() => {
            setAll((v) => !v)
            setLimit(60)
          }}
        >
          {all ? '收起，查看常用图标' : `浏览全部 ${PROJECT_ICONS.length} 个图标`}
        </View>
      )}
    </View>
  )
}
