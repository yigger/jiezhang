// HTTP wire types, checked against jiezhang-backend/internal/types.
// Keep nullable fields and response envelopes explicit.
export type FlexibleAmount = string | number

export interface AccountBookCreateRequest {
  name: string
  description: string
  account_type: string
  categories: Record<string, AccountBookCategoryItem[]>
  assets: AccountBookAssetItem[]
}

export interface AccountBookUpdateRequest {
  name: string
  description: string
  account_type: { id: string }
}

export interface AccountBookCategoryItem {
  name: string
  icon_path: string
  childs: AccountBookChildItem[]
}

export interface AccountBookAssetItem {
  name: string
  icon_path: string
  type: string
  childs: AccountBookChildItem[]
}

export interface AccountBookChildItem {
  name: string
  icon_path: string
}

export interface AccountBookPresetChild {
  name: string
  icon_path: string
}

export interface AccountBookPresetAsset {
  name: string
  icon_path: string
  type: string
  childs: AccountBookPresetChild[]
}

export interface AccountBookPresetCategory {
  name: string
  icon_path: string
  childs: AccountBookPresetChild[]
}

export interface AccountBookPreset {
  name: string
  categories: Record<string, AccountBookPresetCategory[]>
  assets: AccountBookPresetAsset[]
}

export interface AccountBookDetailItem {
  id: number
  name: string
  description: string
  account_type: AccountBookTypeInfo
}

export interface AccountBookTypeInfo {
  id: string
  name: string
}

export interface AccountBookListItem {
  id: number
  name: string
  description: string
  account_type: number
  account_type_name: string
  user_id: number
  budget: number
  created_at: unknown
  updated_at: unknown
}

export interface AccountBookTypeItem {
  id: string
  name: string
}

export interface AssetWriteRequest {
  wallet: {
    name: string
    amount: string
    parent_id: number
    icon_path: string
    remark: string
    type: string
  }
}

export interface AssetSurplusRequest {
  asset_id: number
  amount: FlexibleAmount
}

export interface AssetShowResponse {
  id: number
  name: string
  order: number
  icon_path: string
  parent_id: number
  type: string
  amount: number
  remark: string
  icon_url: string
}

export interface AssetItem {
  id: number
  name: string
  order: number
  icon_path: string
  icon_url?: string
  parent_id: number
  type: string
  amount: number
  remark?: string
  childs?: AssetItem[]
}

export interface BudgetUpdateRequest {
  type: string
  amount: FlexibleAmount
  category_id?: number | null
}

export interface BudgetCategoryDetail {
  root: BudgetRoot
  childs: BudgetChildItem[]
}

export interface BudgetRoot {
  id: number
  name: string
  icon_path: string
  source_amount: number
  used_amount: string
  amount: string
  surplus: string
  use_percent: number
  surplus_percent: number
}

export interface BudgetChildItem {
  id: number
  name: string
  icon_path: string
  source_amount: number
  amount: string
  surplus: string
  use_percent: number
  used_amount: number
  surplus_percent: number
}

export interface BudgetParentItem {
  id: number
  name: string
  icon_path: string
  source_amount: number
  amount: string
  surplus: string
  used_amount: number
  use_percent: number
  surplus_percent: number
}

export interface BudgetSummary {
  source_amount: number
  amount: string
  used: number
  surplus: number
}

export interface CategoryWriteRequest {
  category: { name: string; parent_id: number; icon_path: string; type: string }
}

export interface CategoryStatementChild {
  id: number
  day: number
  week: string
  type: string
  category: string
  icon_path: string
  description: string
  money: string
  timeStr: string
  asset: string
}

export interface CategoryStatementsMonthItem {
  year: number
  month: number
  childs: CategoryStatementChild[]
}

export interface CategoryShowResponse {
  id: number
  name: string
  order: number
  icon_path: string
  parent_id: number
  type: string
  parent_name: string
  icon_url: string
}

export interface CategoryListResponse {
  header: CategoryHeader
  categories: CategoryItem[]
}

export interface CategoryHeader {
  month: string
  year: string
  all: string
  parent_name?: string
}

export interface CategoryItem {
  id: number
  name: string
  order: number
  icon_path: string
  parent_id: number
  type: string
  amount?: string
  icon_url?: string
  childs?: CategoryItem[]
}

export interface StatementExportResult {
  rows: ExportRow[]
}

export interface StatementExportCheckResult {
  today_count: number
}

export interface ExportRow {
  category: string
  parent_category: string
  type: string
  type_name: string
  asset: string
  description: string
  amount: number
  created_at: string
  updated_at: string
}

export interface WalletTimelineItem {
  expend_amount: number
  income_amount: number
  surplus: number
  year: number
  month: number
  hidden: number
}

export interface WalletTimelineResponse {
  status: number
  data: WalletTimelineItem[]
}

export interface WalletInformation {
  name: string
  income: string
  expend: string
  surplus: string
  source_surplus: number
}

export interface WalletTypeAmountItem {
  category_id: number
  name: string
  amount: string
}

export interface WalletTypeSummary {
  name: string
  amount: string
  childs: WalletTypeAmountItem[]
}

export interface WalletChildAsset {
  id: number
  name: string
  amount: string
  icon_path: string
}

export interface WalletParent {
  name: string
  amount: string
  childs: WalletChildAsset[]
}

export interface WalletHeader {
  total_asset: string
  net_worth: string
  total_liability: string
}

export interface WalletResponse {
  header: WalletHeader
  list: WalletParent[]
  amount_visible: boolean
  receivables: WalletTypeSummary
  payables: WalletTypeSummary
}

export interface FriendInviteRequest {
  account_book_id: number
  role: string
}

export interface FriendInviteInformationRequest {
  invite_token: string
}

export interface FriendAcceptApplyRequest {
  invite_token: string
  nickname: string
}

export interface FriendUpdateRequest {
  account_book_id: number
  role?: string | null
  remark?: string | null
}

export interface FriendRemoveRequest {
  account_book_id: number
}

export interface InviteInformationBook {
  id: number
  name: string
}

export interface InviteInformationItem {
  invite_user: FriendUserItem
  account_book: InviteInformationBook
  role_name: string
}

export interface FriendAuthority {
  change_role: boolean
  remove: boolean
}

export interface FriendUserItem {
  id: number
  nickname: string
  avatar_path: string
}

export interface FriendCollaboratorItem {
  id: number
  role: string
  role_name: string
  remark: string
  user: FriendUserItem
  created_at: string
  updated_at: string
}

export interface FriendListResponse {
  collaborators: FriendCollaboratorItem[]
  owner: FriendUserItem
  authority: FriendAuthority
}

export interface HomeSettingsAccountBook {
  id: number
  name: string
}

export interface HomeSettingsUser {
  uid: number
  name: string
  avatar_url: string
  themes: Theme[]
  theme_id: number
  theme: Theme
  persist: number
  show_diamond: boolean
  remind: boolean
  created_at: string
  account_book: HomeSettingsAccountBook
}

export interface HomeSettingsResponse {
  user: HomeSettingsUser
  version: string
}

export interface HomeHeaderMessage {
  id: number
  title: string
  sub_title: string
}

export interface HomeHeaderTrendItem {
  ratio: number
  trend: string
  amount: string
}

export interface HomeHeaderTrends {
  day: HomeHeaderTrendItem
  week: HomeHeaderTrendItem
  month: HomeHeaderTrendItem
}

export interface HomeHeaderResponse {
  trends: HomeHeaderTrends
  month_expend: string
  today_expend: string
  month_budget: string
  use_pencentage: number
  message: HomeHeaderMessage | null
}

export interface MessageDetailItem {
  title: string
  content: string
  time: string
  content_type: string
  msg_type: string
}

export interface MessageListItem {
  id: number
  title: string
  content: string
  target_type: number
  content_type: string
  already_read: number
  page_url: string
  msg_type: string
  sub_title: string
  time: string
  image_url: string
}

export interface PayeeWriteRequest {
  payee: { name: string }
  name: string
}

export interface PayeeListItem {
  id: number
  name: string
}

export interface SuperWeekData {
  weeks: string[]
  data: number[]
}

export interface SuperLineChartData {
  months: number[]
  expends: number[]
  incomes: number[]
  surplus: number[]
}

export interface SuperCategoryTopItem {
  name: string
  data: number
  format_amount: string
  percent: string
  category_id: number
}

export interface SuperPieItem {
  name: string
  data: number
}

export interface SuperTableSummaryItem {
  date: string
  expend: string
  income: string
  total_income: string
  total_expend: string
  total_surplus: string
}

export interface SuperChartHeaderData {
  expend_count: number
  income_count: number
  surplus: number
  expend_percent: number
  expend_rise: string
  income_percent: number
  income_rise: string
  surplus_percent: number
  surplus_rise: string
}

export interface SuperTimeResponse {
  statements: SuperMonthItem[]
  header: SuperHeader
}

export interface SuperHeader {
  expend: string
  income: string
  left: string
}

export interface SuperMonthItem {
  expend_amount: number
  income_amount: number
  surplus: number
  year: number
  month: number
  hidden: number
}

export interface FeedbackRequest {
  content: string
  type: number
}

export interface StatementListByTokenResult {
  data: StatementListItem[]
  date_range: StatementDateRangeItem
  shared_user: StatementSharedUserItem
}

export interface StatementSharedUserItem {
  nickname: string
  avatar_path: string
}

export interface StatementDateRangeItem {
  start_date: string
  end_date: string
}

export interface ShareKeyRequest {
  start_date: string
  end_date: string
  category_ids: string
  exceptedStatementIds: string
  except_statement_ids: string
}

export interface AvatarDeleteRequest {
  avatar_id: number
}

export interface ShareKeyData {
  share_key: string
}

export interface StatementWritePayload {
  type: string
  amount: FlexibleAmount
  description: string
  mood: string
  category_id: number
  asset_id: number
  from_asset_id: number
  to_asset_id: number
  payee_id: number
  target_object: string
  location: string
  nation: string
  province: string
  city: string
  district: string
  street: string
  date: string
  time: string
}

export interface StatementPatchPayload {
  type?: string | null
  amount?: FlexibleAmount | null
  description?: string | null
  mood?: string | null
  category_id?: number | null
  asset_id?: number | null
  from_asset_id?: number | null
  to_asset_id?: number | null
  payee_id?: number | null
  target_object?: string | null
  location?: string | null
  nation?: string | null
  province?: string | null
  city?: string | null
  district?: string | null
  street?: string | null
  date?: string | null
  time?: string | null
}

export interface StatementWriteRequest {
  statement: StatementWritePayload
}

export interface StatementPatchRequest {
  statement: StatementPatchPayload
}

export interface StatementDetailItem extends StatementBaseItem {
  amount_number: number
  location: string
  province: string
  city: string
  street: string
  month_day: string
  has_pic: boolean
  created_at: string
  updated_at: string
  upload_files: StatementUploadFileItem[]
  target_asset_id: number
  residue: string
  target_asset?: StatementTargetAssetInfo | null
  can_edit: boolean
}

export interface StatementUploadFileItem {
  id: number
  url: string
}

export interface StatementTargetAssetInfo {
  id: number
  name: string
}

export interface StatementListItem extends StatementBaseItem {
  location: string
  province: string
  city: string
  street: string
  month_day: string
  has_pic: boolean
  created_at: string
  updated_at: string
}

export interface StatementBaseItem {
  id: number
  type: string
  amount: number
  description: string
  title: string
  target_object: string
  mood: string
  money: string
  category: string
  icon_path: string
  asset: string
  date: string
  time: string
  timeStr: string
  week: string
  payee: StatementPayee
  remark: string
  category_id: number
  asset_id: number
}

export interface StatementPayee {
  id: number
  name: string
}

export interface StatementDefaultCategoryAssetItem {
  category_name: string
  asset_name: string
  category_id: number
  asset_id: number
}

export interface StatementAssetsResult {
  frequent: StatementFrequentAssetItem[]
  categories: StatementAssetTreeItem[]
}

export interface StatementAssetTreeItem {
  id: number
  name: string
  icon_path: string
  childs: StatementAssetChildItem[]
}

export interface StatementAssetChildItem {
  id: number
  name: string
  icon_path: string
}

export interface StatementAssetParentItem {
  id: number
  name: string
}

export interface StatementFrequentAssetItem {
  id: number
  name: string
  icon_path: string
  parent: StatementAssetParentItem | null
}

export interface StatementCategoriesResult {
  frequent: StatementFrequentCategoryItem[]
  categories: StatementCategoryTreeItem[]
}

export interface StatementCategoryTreeItem {
  id: number
  name: string
  icon_path: string
  childs: StatementCategoryChildItem[]
}

export interface StatementCategoryChildItem {
  id: number
  name: string
  icon_path: string
}

export interface StatementCategoryParentItem {
  id: number
  name: string
}

export interface StatementFrequentCategoryItem {
  id: number
  name: string
  icon_path: string
  parent: StatementCategoryParentItem | null
}

export interface StatementImagesResult {
  avatar_timeline: StatementImageYearGroup[]
  avatars: string[]
}

export interface StatementImageYearGroup {
  year: number
  data: StatementImageMonthGroup[]
}

export interface StatementImageMonthGroup {
  month: number
  data: StatementImageItem[]
}

export interface StatementImageItem {
  statement_id: number
  avatar_id: number
  path: string
}

export interface CalendarDataItem {
  date: number
  income: number
  expend: number
}

export interface OverviewHeaderData {
  total: number
  repay: number
  transfer: number
  income: number
  expend: number
}

export interface Theme {
  id: number
  name: string
  class_name: string
}

export interface UploadResult {
  status: number
  avatar_path?: string
}

export interface UserUpdateRequest {
  user: UserUpdatePayload
}

export interface UserUpdatePayload {
  theme_id?: number | null
  country?: string | null
  city?: string | null
  gender?: number | null
  language?: string | null
  province?: string | null
  bg_avatar_id?: number | null
  hidden_asset_money?: boolean | null
  avatar_url?: string | null
  nickname?: string | null
  bg_avatar?: string | null
}

export interface UserScanLoginRequest {
  qr_code: string
}

export interface UserProfile {
  id: number
  theme_id: number
  avatar_url: string
  nickname: string
  persist: number
  sts_count: number
  email: string
  remind: boolean
  hidden_asset_money: boolean
}

export interface UserCreateRequest {
  name: string
  email: string
}
