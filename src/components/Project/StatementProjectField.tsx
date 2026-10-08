import type { InsightWorkspace } from '@/api/logic/insights'
import { Input, ScrollView, View } from '@tarojs/components'
import { useState } from 'react'
import { projectAppearance } from '@/utils/project-appearance'
import '@/src/styles'

export default function StatementProjectField({
  workspace,
  projectID = 0,
  consumerID = 0,
  currentUserID,
  onChange
}: {
  workspace: InsightWorkspace
  projectID?: number
  consumerID?: number
  currentUserID?: number
  onChange: (projectID: number, consumerID: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const projects = workspace.projects.filter((p) => !p.archived)
  const project = projects.find((p) => p.id === projectID)
  const members = workspace.members.filter(
    (m) => !project?.participant_ids?.length || project.participant_ids.includes(m.id)
  )
  if (!projects.length && !projectID) return null
  const appearance = projectAppearance(project || {})
  const choose = (id: number) => {
    const next = projects.find((p) => p.id === id)
    const eligible = workspace.members.filter(
      (m) => !next?.participant_ids?.length || next.participant_ids.includes(m.id)
    )
    onChange(id, id ? eligible.find((m) => m.id === currentUserID)?.id || eligible[0]?.id || 0 : 0)
    setOpen(false)
    setQuery('')
  }
  return (
    <View className="statement-project">
      <View className="statement-project__row" onClick={() => setOpen(true)}>
        <View className="statement-project__label">
          <View className={`iconfont ${appearance.icon}`} style={{ color: appearance.color }} />
          <View>项目</View>
        </View>
        <View>{project?.name || (projectID ? '项目已不可用，请重新选择' : '不计入项目')} ›</View>
      </View>
      {project && (
        <View className="statement-project__members">
          <View>消费人</View>
          {members.map((m) => (
            <View
              key={m.id}
              className={consumerID === m.id ? 'is-selected' : ''}
              onClick={() => onChange(project.id, m.id)}
            >
              {m.name}
              {consumerID === m.id ? ' ✓' : ''}
            </View>
          ))}
        </View>
      )}
      {open && (
        <View className="statement-project__overlay" onClick={(e) => e.stopPropagation()}>
          <View className="statement-project__mask" onClick={() => setOpen(false)} />
          <View className="statement-project__panel">
            <View className="statement-project__row">
              <View>选择项目</View>
              <View onClick={() => setOpen(false)}>关闭</View>
            </View>
            <Input
              className="statement-project__search"
              value={query}
              placeholder="搜索项目名称"
              onInput={(e) => setQuery(e.detail.value)}
            />
            <ScrollView scrollY className="statement-project__list">
              <View className="statement-project__choice" onClick={() => choose(0)}>
                不计入项目{!projectID ? ' ✓' : ''}
              </View>
              {projects
                .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
                .map((p) => {
                  const a = projectAppearance(p)
                  return (
                    <View
                      key={p.id}
                      className="statement-project__choice"
                      onClick={() => choose(p.id)}
                    >
                      <View
                        className={`iconfont ${a.icon}`}
                        style={{ color: a.color, background: a.tint }}
                      />
                      <View>
                        {p.name}
                        {projectID === p.id ? ' ✓' : ''}
                      </View>
                    </View>
                  )
                })}
              {!projects.some((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())) && (
                <View className="statement-project__empty">没有找到匹配的项目</View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}
