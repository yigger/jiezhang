export default {
  pages: [
    // 首页
    'pages/home/index',
    // 创建账单的表单
    'pages/statement/form',
    'pages/statement_detail/index',
    // 分类管理
    'pages/setting/category/index',
    'pages/setting/category/form',
    // 资产管理
    'pages/setting/asset/index',
    'pages/setting/asset/form',
    // 预算管理
    'pages/setting/budget/index',
    'pages/setting/child_budget/index',
    // 账簿管理
    "pages/account_books/create",
    "pages/account_books/edit",
    "pages/account_books/list",
    // 设置的相关页面
    'pages/setting/search/search',
    'pages/setting/statements_flow/index',
    'pages/assets_flow/index',
    "pages/setting/feedback/index",
    "pages/setting/messages/index",
    "pages/setting/messages/detail",
    "pages/setting/user_info/index",
    'pages/setting/chart/category_statement',
    'pages/setting/statement_imgs/index',
    // 导出
    'pages/setting/statements_manage/data_out',
    // 登录网页端
    'pages/setting/statements_manage/data_in',
    // 账单的分享页面
    'pages/share/index',
    'pages/share/public',
    // 商家管理界面
    'pages/payee/list',
    // 好友管理界面
    'pages/friends/index',
    'pages/friends/invite_info',
  ],
  subPackages: [
    {
      root: 'pages/sub',
      pages: ['chart/index'],
      independent: true,
    },
  ],
  requiredPrivateInfos: [
    'chooseLocation'
  ],
  window: {
    navigationBarTitleText: 'WeChat',
    backgroundTextStyle         : 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTextStyle      : 'white',
    navigationStyle             : 'custom',
  }
}
