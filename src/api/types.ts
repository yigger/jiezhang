export * from './models'
export type Id = number | string
export type StatementType =
  | 'expend'
  | 'income'
  | 'transfer'
  | 'repayment'
  | 'loan_in'
  | 'loan_out'
  | 'reimburse'
  | 'payment_proxy'
export type Query = Record<string, string | number | boolean | undefined>
export interface Envelope<T = unknown> {
  status: number
  data: T
  msg?: string
  message?: string
}
export interface StatusResponse {
  status: number
  msg?: string
  message?: string
}
export interface SelectionItem {
  id: number
  name: string
  icon_path: string
  parent?: { id: number; name: string } | null
  childs?: SelectionItem[]
}
export interface SelectionData {
  frequent: SelectionItem[]
  data: SelectionItem[]
}
export type FriendInviteResponse = Envelope<string>
export type InviteInfoResponse = Envelope<import('./models').InviteInformationItem>
export type InviteInfo = import('./models').InviteInformationItem
export type User = import('./models').FriendUserItem
export type AccountBook = import('./models').HomeSettingsAccountBook
export type HeaderResponse = import('./models').HomeHeaderResponse
export type Statement = import('./models').StatementListItem
export type StatementsResponse = Statement[]
export interface YearMonth {
  year: number | string
  month: number | string
}
