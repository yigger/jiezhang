import type { HomeTab } from '@/src/types/ui'

export const homeTabs = [
  { page: 'index', name: '首页', icon: 'jcon-home1' },
  { page: 'statistic', name: '统计', icon: 'jcon-linechart' },
  { page: 'project', name: '项目', icon: 'jcon-project' },
  { page: 'asset', name: '资产', icon: 'jcon-creditcard' },
  { page: 'profile', name: '我的', icon: 'jcon-user' }
] as const satisfies readonly HomeTab[]
export type HomeTabID = (typeof homeTabs)[number]['page']
export const defaultHomeTabIDs: HomeTabID[] = homeTabs.map((tab) => tab.page)
export function normalizeHomeTabs(value: unknown): HomeTabID[] {
  if (!Array.isArray(value)) return [...defaultHomeTabIDs]
  const valid = new Set<string>(defaultHomeTabIDs)
  const result: HomeTabID[] = []
  for (const id of value)
    if (typeof id === 'string' && valid.has(id) && !result.includes(id as HomeTabID))
      result.push(id as HomeTabID)
  if (!result.length) return [...defaultHomeTabIDs]
  if (!result.includes('index')) result.unshift('index')
  if (!result.includes('profile')) result.push('profile')
  return result
}
export function moveHomeTab(order: HomeTabID[], id: HomeTabID, direction: -1 | 1): HomeTabID[] {
  const next = [...order],
    index = next.indexOf(id),
    target = index + direction
  if (index < 0 || target < 0 || target >= next.length) return next
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
