export interface User {
  id: number
  nickname: string
  avatar_path: string 
}

// 请求失败的响应通用
type FailureResponse = {
  status: Exclude<number, 200>
  data?: never
  msg: string
}

// AccountBook 通用格式
export interface AccountBook {
  id: number
  name: string
}

export interface HeaderMessage {
  id: number
  title: string
}

export interface HeaderResponse {
  message: HeaderMessage
  month_budget: string
  month_expend: string
  today_expend: string
  use_pencentage: number
}

export interface Statement {
  id: number
  type: 'expend' | 'income' | 'transfer'
  description: string
  title: string | null
  amount: string
  money: string
  asset: string
  category: string
  city: string | null
  date: string
  icon_path: string
  location: string | null
  month_day: string
  province: string | null
  street: string | null
  time: string
  timeStr: string
  week: string
}

export interface StatementsResponse {
  statements: Statement[]
}

// 邀请好友的请求
export interface FriendInviteRequest {
  account_book_id: number
  access: string[]
}

// 邀请好友成功的响应
type FriendInviteSuccessResponse = {
  status: 200
  data: string
  msg?: never
}
export type FriendInviteResponse = FriendInviteSuccessResponse | FailureResponse

// 邀请成功的邀请信息的响应
// 包含了被邀请人的信息和被邀请的账簿的信息
export interface InviteInfo {
  account_book: AccountBook
  invite_user: User
  access: string
}

interface InviteInfoSuccessResponse {
  status: 200
  data: InviteInfo
  msg?: never
}
export type InviteInfoResponse = InviteInfoSuccessResponse | FailureResponse