# 智慧书城 — 项目计划书

> 目标岗位：前端开发实习生 | 开发周期：3 个月
> 技术策略：70% 常规页面证明工程能力 + 30% 深度模块拉开差距

---

## 一、项目概览

一个以"AI 对话找书"为入口的在线书城，覆盖管理后台、微信小程序、移动端 App 三个端。

**一句话描述**：用户通过 AI 多轮对话找到合适的书籍 -> 加入购物车 -> 下单 -> 订单通过状态机流转 -> WebSocket 实时推送状态变更。

### 三端定位

| 端 | 角色 | 用户 |
|---|---|---|
| 管理后台 (Web) | 管理员/客服 | 图书上下架、订单处理、数据看板、AI 配置 |
| 微信小程序 | C 端用户 | 浏览、AI 找书、下单、查看订单、收藏 |
| App (uni-app) | C 端用户 | 同小程序，编译生成 iOS / Android |

---

## 二、核心流程

### 2.1 主线

```
用户浏览/搜索
    |
    +-- 首页分类浏览 / 热销榜单
    |
    +-- AI 找书（多轮对话，SSE 流式输出推荐）
            |
            v
        书详情页
            |
            +-- 加入购物车 ----------+
            |                      |
            +-- 直接下单             |
                    |               |
                    v               v
              提交订单 <---- 购物车批量结算
                    |
                    v
              订单状态机启动
```

### 2.2 订单全生命周期状态机

```
                      +-----------+
                      |  PENDING  | 待付款（15 分钟倒计时）
                      +-----+-----+
                            |
                +--- 支付成功
                |
                v
         +-----------+
         |    PAID   | 待发货
         +-----+-----+
               | 管理员发货
               v
         +-----------+
         |  SHIPPED  | 已发货
         +-----+-----+
               | 用户确认收货
               v
         +-----------+
         | COMPLETED | 已完成
         +-----+-----+
               | 用户申请退款
               v
         +-----------+
         | REFUNDING | 退款中（管理员审核）
         +-----+-----+
          +----+----+
          v         v
    +---------+ +----------+
    | REFUNDED| | REJECTED |
    | 已退款  | | 退款驳回  |
    +---------+ +----------+

PENDING  --> CANCELLED（超时取消 / 用户主动取消）
PAID     --> CANCELLED（用户取消，需退款）
```

---

## 三、核心功能清单

### 3.1 管理后台（6 个页面）

| 页面 | 路由 | 功能 |
|---|---|---|
| 登录 | `/login` | 账号密码登录，JWT |
| 数据看板 | `/dashboard` | 3 个统计卡片（今日订单/收入/在线用户）+ 2 个图表（7 天趋势、分类占比） |
| 图书管理 | `/books` | 列表（分页/搜索/分类筛选）+ 新建/编辑表单 + 上下架开关 |
| 订单管理 | `/orders` | 订单列表（状态筛选/搜索）+ 订单详情 + 操作按钮（发货/退款审核） |
| AI 配置 | `/ai-config` | 模型 API Key + 提示词模板编辑 |
| 成员管理 | `/members` | 列表 + 新增成员 + 启用/禁用 + 角色选择（admin/cs） |

### 3.2 微信小程序 / App（7 个页面）

| 页面 | 功能 |
|---|---|
| 首页 | 搜索栏 + Banner + 分类入口 + 热销榜 + 新品推荐 |
| 分类 | 左侧分类树 + 右侧图书列表（上拉加载更多） |
| AI 找书 | 对话界面 + SSE 流式输出 + 打字机效果 + 结果卡片（封面/书名/价格/跳转） |
| 购物车 | 列表（勾选/数量/删除）+ 全选反选 + 合计 + 去结算 |
| 书详情 | 封面大图 + 简介 + 相似推荐 + 加入购物车 / 立即购买 |
| 订单列表 | 状态 Tab（全部/待付款/待发货/已发货/已完成）+ 进度条 + 操作按钮 |
| 我的 | 头像昵称 + 收藏夹 + 浏览记录 + 收货地址 |

---

## 四、三种技术深点

### 4.1 订单状态机（前端驱动）

用枚举 + 映射表在前端维护完整状态定义，UI 自动适配。

```typescript
enum OrderStatus {
  PENDING, PAID, SHIPPED, COMPLETED,
  CANCELLED, REFUNDING, REFUNDED, REJECTED
}

const ORDER_STATUS_MAP = {
  [OrderStatus.PENDING]: {
    label: "待付款", color: "orange",
    next: [OrderStatus.PAID, OrderStatus.CANCELLED],
    actions: ["pay", "cancel"], timer: 900
  },
  // ... 每个状态都定义 label/color/next/actions
}
```

面试能讲：
- 状态机驱动 UI：进度条进度、按钮显隐、倒计时由状态决定，不是写死 if-else
- 状态变更通过 WebSocket 推送，前端即时响应
- 待付款 15 分钟倒计时：前端定时器 + 后端定时任务双保险
- 与 XState 的取舍：XState 功能完备但 bundle 体积大，手写映射表更轻量且易维护

### 4.2 AI 流式推荐（SSE + ReadableStream）

```
用户输入: "适合初学者的 Python 书，国内作者"
          |
          v
    POST /api/ai/recommend (SSE 流式)
          |
          v
   fetch + ReadableStream 逐 chunk 读取
          |
          v
   chunk 拼接 -> Markdown 增量解析 -> 打字机效果 -> 渲染为图书卡片
          |
          v
   用户可追问 -> AI 结合上下文继续推荐
```

面试能讲：
- `fetch` + `ReadableStream.getReader()` 逐 chunk 消费
- chunk 断开时自动重连并从断点继续（记录 lastEventId）
- 流式 Markdown 增量解析：书名加粗 -> `**` 配对检测 -> 描述分段 -> 卡片组件渲染
- XSS 防护：Markdown 解析后对 HTML 做 sanitize（DOMPurify），AI 返回内容不可信
- 多轮对话上下文管理：session 存 Redis，每次请求带 sessionId

### 4.3 前端性能优化体系

**构建层**：
- 路由懒加载：`() => import('@/views/books/index.vue')`，按路由拆 chunk
- 第三方库按需引入：Ant Design Vue 按组件 tree-shaking，ECharts 按图表类型引入
- `vite-plugin-compression`：构建时 gzip 压缩静态资源

**运行时**：
- 图书列表超过 50 条启用虚拟滚动（`vue-virtual-scroller`），只渲染可视区域内的 DOM 节点
- 封面图处理：列表用缩略图（`?w=200`），详情用原图；`<img loading="lazy">` 懒加载
- 搜索输入防抖（300ms），表单提交节流
- 页面切换时 `AbortController` 取消未完成的请求，避免竞态

**监控**：
- `PerformanceObserver` 采集 FCP / LCP / CLS 指标
- `window.onerror` + `unhandledrejection` 收集前端异常，上报到日志接口

---

## 五、技术栈

| 层 | 技术 |
|---|---|
| 管理后台 | Vue 3 + Vite + TypeScript + Ant Design Vue + Pinia + Tailwind CSS |
| 小程序/App | uni-app (Vue 3) + uView UI + 分包加载 |
| 后端 | NestJS（TypeScript 全栈统一，前后端共享 DTO 类型） |
| 数据库 | MySQL 8 + Redis 7 |
| AI | DeepSeek / 通义千问 API |
| 流式协议 | SSE (Server-Sent Events) |
| WebSocket | 自研 composable（心跳 + 重连 + 指数退避） |
| 部署 | Docker Compose（管理后台预览地址：Vercel 部署） |

---

## 六、前端工程化设计

### 6.1 项目目录结构（管理后台）

```
src/
├── api/              # 接口请求层（按模块拆分）
│   ├── request.ts    # Axios 实例 + 拦截器
│   ├── auth.ts       # 登录/注册接口
│   ├── books.ts
│   ├── orders.ts
│   └── ...
├── components/       # 全局通用组件
│   ├── BookCard.vue
│   ├── StatusBadge.vue
│   ├── EmptyState.vue
│   ├── PageLoading.vue
│   └── ImageUpload.vue
├── composables/      # 组合式函数
│   ├── useWebSocket.ts
│   ├── usePagination.ts
│   └── usePermission.ts
├── stores/           # Pinia 状态管理
│   ├── user.ts
│   ├── cart.ts
│   └── app.ts
├── utils/            # 工具函数
│   ├── auth.ts       # token 存取/解析
│   ├── format.ts     # 日期/金额格式化
│   └── validate.ts   # 通用校验规则
├── views/            # 页面（按路由分组）
│   ├── dashboard/
│   ├── books/
│   └── orders/
├── router/           # 路由配置 + 导航守卫
└── App.vue
```

### 6.2 请求封装层

```
请求拦截器: 自动附加 Authorization header (JWT)
响应拦截器:
  ├── 统一错误码映射 (401 -> 清除 token 跳登录)
  ├── 全局 toast 错误提示
  └── token 过期静默刷新
```

每个请求支持传入 `signal: AbortSignal`，页面卸载时自动取消未完成的请求。

### 6.3 全局错误处理

三层兜底：
1. 接口层：响应拦截器统一 toast 错误信息
2. 页面级：每个页面组件的顶级 `<Suspense>` + `onErrorCaptured` 捕获渲染错误
3. 全局：`app.config.errorHandler` 兜底，记录到 console + 上报日志接口

### 6.4 通用组件三态约定

每个数据驱动的组件都涵盖三种状态：

| 状态 | 表现 |
|---|---|
| loading | 骨架屏（优先）/ Spin 加载动画 |
| empty | 插画 + "暂无数据" + 操作引导（如"去逛逛"按钮） |
| error | 错误提示 + "重试"按钮，不白屏 |
| data | 正常渲染数据 |

### 6.5 环境变量

```
.env.development   VITE_API_BASE=http://localhost:3000/api
.env.production    VITE_API_BASE=https://api.bookstore.cn/api
```

---

## 七、移动端适配策略

### 7.1 uni-app 适配

- 尺寸单位：全部使用 `rpx`（750rpx = 屏幕宽度），自动等比缩放
- 安全区适配：底部操作栏 `padding-bottom: env(safe-area-inset-bottom)`
- 条件编译：`#ifdef MP-WEIXIN` / `#ifdef APP-PLUS` 处理平台差异

### 7.2 小程序分包

```
主包（< 2MB）: 首页 + AI 找书（核心体验，首屏优先加载）
分包 A: 分类 + 书详情
分包 B: 购物车 + 订单 + 我的
```

- 预下载规则：进入首页后预下载分包 A
- 静态资源 CDN 外链，不打进包内

### 7.3 移动端交互细节

| 场景 | 实现 |
|---|---|
| 列表加载 | 上拉触底触发 `onReachBottom`，骨架屏占位 |
| 下拉刷新 | `onPullDownRefresh`，刷新完成后 `stopPullDownRefresh` |
| 空状态 | 插图 + 引导文案（购物车空 -> "去逛逛"；收藏空 -> "去发现好书"） |
| 加载态 | Spin（数据加载）+ 骨架屏（首屏渲染） |
| 操作反馈 | 点击按钮 -> loading 态 + 防抖，成功 toast，失败 toast + 不回退 |

### 7.4 App 端差异处理

- iOS 状态栏高度适配（`plus.navigator.getStatusbarHeight()`）
- Android 返回键拦截：购物车已修改未保存时弹窗确认
- App 端用原生图片选择器代替小程序 `wx.chooseImage`

---

## 八、API 设计概要

```
POST   /api/auth/login
POST   /api/auth/register

GET    /api/books                  图书列表（分页/搜索/分类筛选）
GET    /api/books/:id              图书详情
POST   /api/books                  新增图书 (admin)
PUT    /api/books/:id              编辑图书 (admin)
PATCH  /api/books/:id/status       上下架 (admin)

GET    /api/categories             分类树

GET    /api/cart                   我的购物车
POST   /api/cart                   加入购物车
PUT    /api/cart/:id               修改数量
DELETE /api/cart/:id               删除
DELETE /api/cart                   清空

POST   /api/orders                 下单
GET    /api/orders                 我的订单（支持 status 筛选）
GET    /api/orders/:id             订单详情
PUT    /api/orders/:id/status      推进状态 (admin/cs)

POST   /api/ai/recommend           流式推荐 (SSE)
POST   /api/ai/sessions            新建对话
GET    /api/ai/sessions            对话列表
GET    /api/ai/sessions/:id        历史消息

GET    /api/favorites              我的收藏
POST   /api/favorites              收藏
DELETE /api/favorites/:id          取消收藏

GET    /api/dashboard/stats        统计数据 (admin)
GET    /api/dashboard/trends       趋势数据 (admin)

POST   /api/members                新增成员 (admin)
GET    /api/members                成员列表 (admin)
PATCH  /api/members/:id/status     启用/禁用 (admin)
```

---

## 九、WebSocket 通信

| 频道 | 方向 | 数据 | 消费端 |
|---|---|---|---|
| `/order/{userId}` | server->client | 订单状态变更 | 小程序/App |
| `/order/admin` | server->client | 新订单/退款申请提醒 | 管理后台 |

连接管理：
- 心跳间隔 30s，重连指数退避（1s / 2s / 4s / 8s，上限 30s）
- 重连后自动拉取最新状态（拉模式兜底推模式）
- 断网消息入离线队列，重连后批量推送
- 页面 `onUnmounted` 时自动断开连接

---

## 十、数据库核心表

```sql
users       (id, username, password, nickname, avatar, role, status, created_at)
books       (id, title, author, cover_url, price, original_price,
             category_id, description, stock, status, created_at)
categories  (id, name, parent_id, sort)
orders      (id, user_id, order_no, total_amount, status,
             tracking_no, address_snapshot, created_at, paid_at, shipped_at)
order_items (id, order_id, book_id, book_title, price, quantity, cover_url)
cart_items  (id, user_id, book_id, quantity, created_at)
ai_sessions (id, user_id, title, created_at)
ai_messages (id, session_id, role, content, created_at)
favorites   (id, user_id, book_id, created_at)
```

---

## 十一、权限设计（极简）

| 角色 | 后台菜单 | 操作 |
|---|---|---|
| admin | 全部可见 | 图书 CRUD + 订单处理 + AI 配置 + 成员管理 |
| cs | 订单管理、数据看板(只读) | 查看订单 + 发货 + 退款审核 |

不做：菜单动态权限树、部门隔离、细粒度数据权限。

---

## 十二、开发流程与协作

### 12.1 Git 分支策略

```
main                   生产分支（最终交付）
├── dev                开发分支
│   ├── feature/books  图书模块
│   ├── feature/orders 订单模块
│   ├── feature/ai     AI 对话模块
│   └── ...
```

- Commit message 规范：`feat: 图书列表页开发` / `fix: 修复订单状态流转异常`
- 一个模块完成后合并到 dev，自测通过后打 tag

### 12.2 前后端并行开发

后端接口 Ready 之前，前端使用 **Mock 数据** 开发：

| 方案 | 场景 |
|---|---|
| vite-plugin-mock | 本地开发时拦截请求，返回 mock 数据 |
| Apifox / Swagger Mock | 按接口文档自动生成 mock，模拟延迟和异常 |

### 12.3 API 文档

NestJS 使用 `@nestjs/swagger` 自动生成 Swagger 文档，前端据此定义 TypeScript 接口类型。

---

## 十三、开发计划

### 第一阶段：骨架搭建（第 1-3 周）

| 周次 | 内容 |
|---|---|
| W1 | 搭建管理后台骨架（目录结构/路由/布局/请求封装/环境变量/权限拦截）+ Mock 环境 |
| W2 | 图书管理 CRUD（后端接口 + 后台页面 + 小程序列表页 + 骨架屏） |
| W3 | 用户注册登录（JWT 存取 + token 刷新）+ 分类管理 + 小程序首页 |

### 第二阶段：核心链路（第 4-7 周）

| 周次 | 内容 |
|---|---|
| W4 | 购物车（后端 + 小程序购物车页：全选/数量/删除/结算 + 空状态） |
| W5 | 下单 + 订单状态机（枚举映射 + 状态流转 + 倒计时组件） |
| W6 | WebSocket 封装（心跳/重连/消息路由）+ 订单状态实时推送 |
| W7 | 后台订单管理（发货/退款审核）+ 收货地址管理 |

### 第三阶段：AI 深度（第 8-10 周）

| 周次 | 内容 |
|---|---|
| W8 | 后端 AI 推荐接口（DeepSeek API + SSE 流式 + session 管理） |
| W9 | 前端流式渲染（ReadableStream + 打字机 + 卡片渲染 + XSS sanitize） |
| W10 | 多轮对话上下文 + AI 配置后台 + 断点续传 |

### 第四阶段：收尾打磨（第 11-12 周）

| 周次 | 内容 |
|---|---|
| W11 | 数据看板（ECharts）+ 收藏 + 性能优化（虚拟滚动/路由懒加载/图片懒加载） |
| W12 | uni-app 打包 App + 部署上线 + 简历编写 + 模拟面试准备 |

---

## 十四、面试叙事（3 分钟）

1. **一句话**（15s）：AI 对话找书 -> 下单 -> 状态机流转 -> WebSocket 实时推送
2. **两个核心深点**（2min）：
   - 订单状态机：枚举映射表驱动 UI，为什么不用 XState，倒计时双保险
   - AI 流式渲染：ReadableStream 逐 chunk 消费、增量 Markdown 解析、XSS sanitize、断点续传
3. **工程能力**（30s）：Vue 3 + uni-app + NestJS 全栈 TypeScript，请求封装 + 错误处理三层兜底，WebSocket 自研 composable
4. **留钩子**：虚拟滚动怎么判断是否在可视区？重连指数退避具体怎么算？AbortSignal 怎么中断请求？

---

## 十五、不做的东西

- 不做真实支付对接（模拟支付）
- 不做物流 API 对接（手动填运单号）
- 不做国际化
- 不做 CI/CD
- 不做微前端
- 不做单元测试全覆盖（请求封装、状态机映射表、工具函数写几个关键用例即可）
- 不做 SEO（SPA 天然不友好，非本项目重点）

---

## 十六、交付物清单

| 交付物 | 说明 |
|---|---|
| 项目源码 | GitHub 仓库，含完整 commit 历史 |
| README.md | 项目介绍 + 架构图 + 本地启动步骤 + 功能截图 + 技术栈说明 |
| 管理后台 | Vercel 部署，可访问的线上地址 |
| 小程序 | 体验版二维码 |
| App | APK 安装包（debug 版） |
