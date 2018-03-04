/**
 * 小程序配置文件
 */

var environment = 'dev'

// development
var proxy = 'http';
var host = 'git.com/api';

if (environment !== 'dev') {
  proxy = 'https';
  host = 'xiaoyounger.com/api';
}

var config = {

    // 下面的地址配合云端 Demo 工作
    service: {
        host,
        loginUrl: `${proxy}://${host}/login`,
    },
    api: {
      // 首页数据
      indexList: `${proxy}://${host}/index`,
      // 记一笔的几个接口
      bills: `${proxy}://${host}/bills`,
      billAssets: `${proxy}://${host}/bills/assets`,
      billCategories: `${proxy}://${host}/bills/categories`,
      // 钱包
      wallet: `${proxy}://${host}/wallet`,
      // 流水
      chart: `${proxy}://${host}/chart`,
      assets: `${proxy}://${host}/assets`,
      // 设置
      setting: `${proxy}://${host}/settings`,
      category: `${proxy}://${host}/category`,
      categoryParent: `${proxy}://${host}/category/parent`, // 获取父分类
      
      // icons
      icons: `${proxy}://${host}/icons` // 获取图标列表
    }
};

module.exports = config;