# 洁账小程序

重要：基于 wepy 的老版本已经不维护了，请切换到 Taro 最新版本！！

一款简单易用的记账小程序，帮助用户轻松管理个人财务。

后端代码请切换到旧版本-配合 wepy 前端使用：https://github.com/yigger/jiezhang/tree/old-version-wepy

新版（此版本）的后端暂未开源，敬请期待！
### API 文档
API 契约由后端 Swagger 维护；前端请求与响应类型集中在 `src/api/models.ts`。

### 体验二维码
![二维码](https://github.com/yigger/jiezhang/raw/old-version-wepy/screenshots/qrcode.jpg)

## 功能特点

- 📝 快速记账：支持收入、支出、转账等多种记账类型
- 👥 多人协作：支持添加好友共同记账
- 📊 数据统计：直观的图表展示收支情况
- 💰 预算管理：设置预算，控制支出
- 📱 跨端同步：数据云端同步，随时随地记账
- 🔍 账单搜索：快速查找历史账单

## 技术栈
- Taro v4.2.1
- React 18
- TypeScript
- Taro UI 3.4.1（使用官方预编译 CSS）
- 微信小程序原生能力

## 环境要求
- Node.js >= 22（本次使用 22.23.1 验证）
- Taro CLI 4.2.1（项目本地依赖，无需全局安装）

## 开始使用

1. 克隆项目
```bash
git clone git@github.com:yigger/jiezhang.git jiezhang-miniapp
cd jiezhang-miniapp
```

2. 安装依赖

统一使用 npm 和 `package-lock.json`。安装时为 Taro UI 声明的跨平台 peer 依赖启用兼容模式，避免微信/H5 构建被拉入 React Native 依赖。
```bash
npm ci --legacy-peer-deps
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
```
src/
├── api/          # API 接口
├── assets/       # 静态资源
├── components/   # 公共组件
├── config/       # 配置文件
├── pages/        # 页面文件
├── router/       # 路由组件
├── stores/       # 状态管理
├── utils/        # 工具函数
├── app.ts        # 应用入口
├── app.config.ts # 小程序配置文件
└── jz.ts         # 全局变量
```

## TypeScript 与质量检查

业务代码统一使用 TS/TSX，开启 `strict`。组件属性、状态、API 参数和响应需要明确类型；禁止显式 `any`，类型导入使用 `import type`。第三方声明使用 `skipLibCheck`，内置 ECharts 文件不参与源码检查。

```bash
npm run check        # 类型、ESLint、Prettier 与回归测试
npm run format       # 统一格式
npm run build:weapp  # 微信小程序生产构建
NODE_ENV=production npm run build:h5
```

- API 的原始响应与 `data` 包装响应分别声明；修改接口时同步后端契约。类型断言不能替代外部输入校验。
- 请求层对网络、HTTP 和业务失败统一抛错；调用方使用 `await` 或 `runTask`/`guardEvent` 处理异步错误。写请求不自动重试网络失败，避免重复记账。
- React Hook 保持依赖完整，订阅在卸载时清理。MobX 异步更新放在 `runInAction` 中；账簿切换和查询竞争需要防止旧响应覆盖新状态。
- 金额输入统一校验为正数且最多两位小数。富文本仅渲染允许的标签与安全图片地址。
- `tests/` 覆盖请求鉴权、重试边界、金额、树形编辑、富文本和钱包缓存等逻辑，使用模拟平台接口，不代替后端联调或微信真机验证。

主题通过 `BasePage` 根节点上的 `jz-theme-*` class 设置 CSS 变量，样式定义在 `src/assets/styl/themes/index.styl`。新增主题时保持后端 `class_name` 与此处的 class 一致，不依赖小程序的 `data-*` 属性传递主题。

## 提交规范

项目使用 Commitizen 引导填写 Conventional Commits，Husky 执行提交检查，commitlint 校验提交信息。

首次克隆后运行以下命令安装依赖、启用 hooks，并在当前仓库配置 `git cz`（无需全局安装）：

```bash
npm ci --legacy-peer-deps
git config --local alias.cz '!npm run commit --'
```

日常提交：

```bash
git add <本次提交的文件>
git cz
# 或 npm run commit
```

提交信息形式为 `type(scope): 描述`，例如 `fix(wallet): 修复隐藏金额显示`。常用类型有 `feat`、`fix`、`refactor`、`docs`、`test`、`chore`，scope 可省略。

每次提交前会对当前工作区执行完整 `npm run check`：TypeScript、ESLint、Prettier 和回归测试，任一步失败都会阻止提交。格式检查只报告问题，可运行 `npm run format` 修复后重新暂存。直接使用 `git commit` 也会执行同样的 hooks，并检查提交信息格式。

## 贡献
欢迎贡献代码，提交 issue，或者提供反馈。

## 许可证
MIT
