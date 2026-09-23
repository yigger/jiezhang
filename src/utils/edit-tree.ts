import type { EditableItem, EditableParent, EditState } from '../types/ui'

function sameItem(left: EditableItem, right: EditableItem): boolean {
  return left.name === right.name && left.icon_path === right.icon_path
}

export function editTree(
  items: EditableParent[],
  edit: EditState,
  value: EditableItem
): EditableParent[] {
  const item = { ...value, name: value.name.trim() }
  if (!item.name) throw new Error('名称不能为空')
  const parent = edit.type === 'add_parent' ? null : edit.parent
  const original = edit.type === 'edit_category' ? edit.category : null
  const siblings = parent ? items.find((entry) => sameItem(entry, parent))?.childs : items
  if (!siblings) throw new Error('列表已变更，请重新打开编辑')
  if (
    siblings.some((entry) => entry.name === item.name && !(original && sameItem(entry, original)))
  ) {
    throw new Error('已存在同名项目，请换个名称')
  }
  if (edit.type === 'add_parent')
    return [...items, { ...item, childs: [], type: item.type ?? 'deposit' }]
  if (edit.type === 'add_child') {
    return items.map((entry) =>
      sameItem(entry, edit.parent) ? { ...entry, childs: [...entry.childs, item] } : entry
    )
  }
  if (edit.parent) {
    const target = edit.parent
    return items.map((entry) =>
      sameItem(entry, target)
        ? {
            ...entry,
            childs: entry.childs.map((child) =>
              sameItem(child, edit.category) ? { ...child, ...item } : child
            )
          }
        : entry
    )
  }
  return items.map((entry) =>
    sameItem(entry, edit.category) ? { ...entry, ...item, childs: entry.childs } : entry
  )
}

export function removeTreeItem(
  items: EditableParent[],
  parent: EditableParent,
  child: EditableItem | null
): EditableParent[] {
  if (!child) return items.filter((entry) => !sameItem(entry, parent))
  return items.map((entry) =>
    sameItem(entry, parent)
      ? {
          ...entry,
          childs: entry.childs.filter((item) => !sameItem(item, child))
        }
      : entry
  )
}
