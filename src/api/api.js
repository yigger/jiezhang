import {
  wxRequest
} from '../utils/wxRequest';

let env = "-test" //-dev 或者 -test
const apiUrl = 'http://git.com/api'
// const apiUrl = 'https://xiaoyounger.com/api'

// 获取首页数据
const getIndexList = (params) => wxRequest(params, `${apiUrl}/index`);

// 获取账单
const Bill = (params, c_id = 0) => {
  let url = `${apiUrl}/bills`
  if (c_id != null && c_id != 0) url = `${url}/${c_id}`
  return wxRequest(params, url)
}

// 获取新建账单的账户
const getBillAssets = (params) => wxRequest(params, `${apiUrl}/bills/assets`);

// 获取新建账单的分类
const getBillCategories = (params) => wxRequest(params, `${apiUrl}/bills/categories`);

// 图表栏的数据获取
const Chart = (params) => wxRequest(params, `${apiUrl}/chart`);

// 资产管理
const Asset = (params, c_id = 0) => {
  let url = `${apiUrl}/assets`
  if (c_id != null && c_id != 0) url = `${url}/${c_id}`
  return wxRequest(params, url)
}

const AssetIcon = () => wxRequest({}, `${apiUrl}/icons/assets`);



// 资产 & 资产设置
const Wallet = (params, c_id = 0) => {
  let url = `${apiUrl}/wallet`
  if (c_id != null && c_id != 0) url = `${url}/${c_id}`
  return wxRequest(params, url)
}
const WalletParent = (params) => wxRequest(params, `${apiUrl}/wallet/parent`);
const WalletList = (params) => wxRequest(params, `${apiUrl}/wallet/list`);

const Category = (params, c_id = 0) => {
  let url = `${apiUrl}/category`
  if (c_id != null && c_id != 0) url = `${url}/${c_id}`
  return wxRequest(params, url)
}

const CategoryParent = (params) => wxRequest(params, `${apiUrl}/category/parent`);
const CategoryIcon = () => wxRequest({}, `${apiUrl}/icons/categories`);

// 个人设置
const Settings = (params) => wxRequest(params, `${apiUrl}/settings`);
// 反馈
const Feedback = (params) => wxRequest(params, `${apiUrl}/settings/feedback`);
// 个人信息
const User = (params, c_id = 0) => {
  let url = `${apiUrl}/users`
  if (c_id != null && c_id != 0) url = `${url}/${c_id}`
  return wxRequest(params, url)
}

// 预算管理界面
const Budget = () => wxRequest({}, `${apiUrl}/budgets`);
const BudgetParent = () => wxRequest({}, `${apiUrl}/budgets/parent`);
const BudgetDetail = (id) => wxRequest({}, `${apiUrl}/budgets/${id}`);

module.exports = {
  getIndexList,
  Bill,
  getBillAssets,
  getBillCategories,
  Chart,
  Asset,
  AssetIcon,
  Settings,
  Category,
  CategoryParent,
  Wallet,
  WalletList,
  WalletParent,
  CategoryIcon,
  Feedback,
  User,
  Budget,
  BudgetParent,
  BudgetDetail
}
