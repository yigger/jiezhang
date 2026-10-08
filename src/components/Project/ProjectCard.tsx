import type { InsightWorkspace } from '@/api/logic/insights'
import { View } from '@tarojs/components'
import { formatMoney } from '@/utils/spending-analysis'
import '@/src/styles'
import { projectAppearance } from '@/utils/project-appearance'
export type Project = InsightWorkspace['projects'][number]
export default function ProjectCard({
  project: p,
  members,
  onOpen,
  onEdit
}: {
  project: Project
  members: { id: number; name: string }[]
  onOpen: () => void
  onEdit?: () => void
}) {
  const names = (p.participant_ids || []).map(
    (id) => members.find((m) => m.id === id)?.name || `成员 ${id}`
  )
  const appearance = projectAppearance(p)
  const remaining = p.budget_cents - p.summary.expend_cents
  return (
    <View className="project-card" onClick={onOpen}>
      <View className="project-card__head">
        <View
          className={`project-card__icon iconfont ${appearance.icon}`}
          style={{ color: appearance.color, background: appearance.tint }}
        />
        <View className="project-card__identity">
          <View className="project-card__name">{p.name}</View>
          <View className="project-card__date">
            {p.start_date || p.end_date
              ? `${p.start_date || '未设开始'} — ${p.end_date || '未设结束'}`
              : '时间未设置'}
          </View>
        </View>
        <View className={`project-card__status ${p.archived ? 'is-archived' : ''}`}>
          {p.archived ? '已归档' : '进行中'}
        </View>
      </View>
      <View className="project-card__amount">
        <View>
          <View className="project-card__label">累计支出</View>
          <View className="project-card__money">¥{formatMoney(p.summary.expend_cents)}</View>
        </View>
        <View className="project-card__budget">
          {p.budget_cents > 0 ? (
            <>
              <View>{remaining < 0 ? '超出预算' : '预算剩余'}</View>
              <View className={remaining < 0 ? 'is-over' : ''}>
                ¥{formatMoney(Math.abs(remaining))}
              </View>
            </>
          ) : (
            <View>未设置预算</View>
          )}
        </View>
      </View>
      {p.budget_cents > 0 && (
        <View className="project-card__track">
          <View
            className={remaining < 0 ? 'is-over' : ''}
            style={{
              background: remaining < 0 ? undefined : appearance.color,
              width: `${Math.min(100, (p.summary.expend_cents / p.budget_cents) * 100)}%`
            }}
          />
        </View>
      )}
      <View className="project-card__foot">
        <View className="project-card__people">
          {names.length ? (
            <>
              <View className="project-card__avatars">
                {names.slice(0, 3).map((name, i) => (
                  <View key={i}>{name.slice(0, 1)}</View>
                ))}
              </View>
              <View>
                {names.slice(0, 3).join('、')}
                {names.length > 3 ? ` 等 ${names.length} 人` : ''}
              </View>
            </>
          ) : (
            <View>未设置参与人</View>
          )}
        </View>
        <View>{p.summary.count} 笔 ›</View>
      </View>
      {onEdit && (
        <View
          className="project-card__edit"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          编辑项目
        </View>
      )}
    </View>
  )
}
