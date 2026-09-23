import type { Dispatch, SetStateAction } from 'react'
export type Setter<T> = Dispatch<SetStateAction<T>>
export interface HomeTab {
  page: string
  name: string
  icon: string
}
export interface EditableItem {
  name: string
  icon_path: string
  childs?: EditableItem[]
  type?: string
}
export interface EditableParent extends EditableItem {
  childs: EditableItem[]
}
export type EditState =
  | { type: 'add_parent' }
  | { type: 'add_child'; parent: EditableParent }
  | { type: 'edit_category'; category: EditableItem; parent: EditableParent | null }
export interface ListHandle {
  addPrentCategory: () => void
}

export type Timeline = Omit<import('../api/types').WalletTimelineItem, 'hidden'> & {
  hidden: number | boolean
  statements?: import('../api/types').StatementListItem[]
}
export interface BannerColumn {
  title?: string
  amount?: string
}
export type StatementFormData = Omit<import('../api/types').StatementWritePayload, 'amount'> & {
  id: number
  amount: string
  upload_files: import('taro-ui/types/image-picker').File[]
}
