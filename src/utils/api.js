import Host from '../utils/host';
import {
  wxRequest,
  wxUpload
} from '../utils/wxRequest';
import wepy from 'wepy';

const apiUrl = Host.url
// 获取首页数据
const getIndexList = (params) => wxRequest(params, `${apiUrl}/index`);
const getIndexHeader = (params) => wxRequest(params, `${apiUrl}/header`);
const getIndexBill = (id) => wxRequest({}, `${apiUrl}/statement/${id}`);

// 获取账单
const Bill = (params, c_id = 0) => {
  let url = `${apiUrl}/statements`
  if (c_id != null && c_id != 0) url = `${url}/${c_id}`
  return wxRequest(params, url)
}
const getBillFrequentUsed = (params) => wxRequest(params, `${apiUrl}/statements/frequent_used`);
const getBillAssets = (params) => wxRequest(params, `${apiUrl}/statements/assets`);
const getExpendCategories = (params) => wxRequest(params, `${apiUrl}/statements/expend_categories`);
const getIncomeCategories = (params) => wxRequest(params, `${apiUrl}/statements/income_categories`);
const guessCategory = (params) => wxRequest(params, `${apiUrl}/statements/category_frequent`);
const guessAsset = (params) => wxRequest(params, `${apiUrl}/statements/asset_frequent`);

// tab 统计
const Chart = (params) => wxRequest(params, `${apiUrl}/chart`);

// 资产管理，设置里面的增删改查
const Asset = (params, c_id = 0) => {
  let url = `${apiUrl}/assets`
  if (c_id != null && c_id != 0) url = `${url}/${c_id}`
  return wxRequest(params, url)
}
const AssetParent = (params) => wxRequest(params, `${apiUrl}/assets/parent`);
const AssetIcon = () => wxRequest({}, `${apiUrl}/icons/assets`);

// 分类管理，设置里面的增删改查
const Category = (params, c_id = 0) => {
  let url = `${apiUrl}/categories`
  if (c_id != null && c_id != 0) url = `${url}/${c_id}`
  return wxRequest(params, url)
}
const CategoryParent = (params) => wxRequest(params, `${apiUrl}/categories/parent`);
const CategoryIcon = () => wxRequest({}, `${apiUrl}/icons/categories`);

// 资产详情
const AssetDetailInformation = (params) => wxRequest(params, `${apiUrl}/wallet/information`);
const AssetDetailList = (params) => wxRequest(params, `${apiUrl}/wallet/detail`);
const AssetSurplus = (params) => wxRequest(params, `${apiUrl}/wallet/surplus`);

// tab 资产总览
const Wallet = (params, c_id = 0) => {
  let url = `${apiUrl}/wallet`
  if (c_id != null && c_id != 0) url = `${url}/${c_id}`
  return wxRequest(params, url)
}

// 个人设置
const Settings = (params) => wxRequest(params, `${apiUrl}/settings`);
// 反馈
const Feedback = (params) => wxRequest(params, `${apiUrl}/settings/feedback`);
// 封面图片
const Covers = (params) => wxRequest(params, `${apiUrl}/settings/covers`);
const SetCover = (params) => wxRequest(params, `${apiUrl}/settings/set_cover`);
// 个人信息
const User = (params, c_id = 0) => {
  let url = `${apiUrl}/users`
  if (c_id != null && c_id != 0) url = `${url}/${c_id}`
  return wxRequest(params, url)
}

// 预算管理界面
const Budget = (params) => wxRequest(params, `${apiUrl}/budgets`);
const BudgetParent = (params) => wxRequest(params, `${apiUrl}/budgets/parent`);
const BudgetDetail = (params, id) => wxRequest(params, `${apiUrl}/budgets/${id}`);
const BudgetUpdate = (params) => wxRequest(params, `${apiUrl}/budgets/0`);

// 文件上传
const Upload = (params) => wxUpload(params, `${apiUrl}/upload`);

module.exports = {
  host: Host.host,
  getIndexList,
  getIndexHeader,
  getIndexBill,
  Bill,
  getBillFrequentUsed,
  getBillAssets,
  getExpendCategories,
  getIncomeCategories,
  Chart,
  Asset,
  AssetIcon,
  Settings,
  Category,
  CategoryParent,
  Wallet,
  CategoryIcon,
  AssetParent,
  Feedback,
  User,
  Budget,
  BudgetParent,
  BudgetDetail,
  BudgetUpdate,
  AssetDetailInformation,
  AssetDetailList,
  AssetSurplus,
  Upload,
  guessCategory,
  guessAsset,
  Covers,
  SetCover
}