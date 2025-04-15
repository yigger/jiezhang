# 洁账小程序

重要：基于 wepy 的老版本已经不维护了，请切换到 Taro 最新版本！！

一款简单易用的记账小程序，帮助用户轻松管理个人财务。

后端代码请切换到旧版本-配合 wepy 前端使用：https://github.com/yigger/jiezhang/tree/old-version-wepy

新版（此版本）的后端暂未开源，敬请期待！

## 功能特点

- 📝 快速记账：支持收入、支出、转账等多种记账类型
- 👥 多人协作：支持添加好友共同记账
- 📊 数据统计：直观的图表展示收支情况
- 💰 预算管理：设置预算，控制支出
- 📱 跨端同步：数据云端同步，随时随地记账
- 🔍 账单搜索：快速查找历史账单

## 技术栈
- Taro v3.6.32
- React
- TypeScript
- Taro UI
- 微信小程序原生能力

## 环境要求
- Node.js 16.14.0
- Taro CLI 3.6.32

## 开始使用

1. 克隆项目
```bash
git clone git@github.com:yigger/jiezhang.git jiezhang-miniapp
cd jiezhang-miniapp
```

2. 安装依赖
```bash
npm install
```

3. 配置
```bash
// 配置小程序 appid, 服务端地址
cp src/config/config.ts.example src/config/config.ts

// 开发环境构建
npm run dev:weapp

// 生产环境构建
npm run build:weapp
```

## 项目结构
src/
├── api/          # API 接口
├── assets/       # 静态资源
├── components/   # 公共组件
├── config/       # 配置文件
├── pages/        # 页面文件
├── router/       # 路由组件
├── store/        # 状态管理
├── utils/        # 工具函数
└── app.tsx       # 应用入口
└── app.config.ts # 小程序配置文件
└── jz.ts         # 全局变量

## 贡献
欢迎贡献代码，提交 issue，或者提供反馈。

## 许可证
MIT