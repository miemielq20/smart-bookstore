# 智慧书城

智慧书城是一个前后端分离的在线图书商城，包含用户 H5 商城、后台管理端和 NestJS API 服务。项目支持图书浏览、分类与搜索、购物车、订单、退款、收藏、收货地址管理，以及基于 DeepSeek 的 AI 选书。

## 在线访问

- **管理端 / 服务端入口**：<http://124.220.16.162:8081>
- **H5 商城**：<http://124.220.16.162:5051>

管理端和 H5 默认通过同源 `/api` 访问接口；线上部署时请确保 Web 服务器将 `/api` 和 `/uploads` 转发到 NestJS 服务。

## 项目结构

```text
smart-bookstore/
├── server/       # NestJS + Prisma API 服务
├── ui/           # Vue 3 + Vite 后台管理端
├── h5/           # uni-app + Vue 3 H5 商城
└── README.md
```

## 功能模块

### H5 商城

- 用户注册、登录和图形验证码
- 首页 Banner、热门图书和新书展示
- 分类浏览、关键词搜索、图书详情
- 购物车、收货地址、订单和退款申请
- 图书收藏、个人资料和系统设置
- AI 选书助手

### 后台管理端

- 数据看板和访问统计
- 图书、分类和 Banner 管理
- 订单列表、发货和退款审核
- 权限组管理
- AI 模型、接口和提示词配置

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 服务端 | NestJS、TypeScript、Prisma、MariaDB/MySQL、Redis、JWT |
| 管理端 | Vue 3、Vite、TypeScript、Element Plus、Pinia |
| H5 | uni-app、Vue 3、TypeScript、uView Plus |
| AI | DeepSeek Chat API（可选） |

## 环境要求

- Node.js 20.19+（或 Node.js 22.12+）
- npm
- MySQL 8 / MariaDB
- Redis 6+
- 可选：DeepSeek API Key

## 快速开始

### 1. 获取代码并安装依赖

cd server
npm install

cd ../ui
npm install

cd ../h5
npm install
```

### 2. 初始化数据库

先创建数据库，然后导入仓库中的 SQL 文件：

```bash
mysql -u root -p < server/database/sm_sys.sql
```

生成 Prisma Client：

```bash
cd server
npx prisma generate
```

项目内置的权限组、菜单和 AI 默认配置
```bash
npx prisma db seed
```
### 3. 启动服务端

```bash
cd server
npm run start:dev
```
### 4. 启动后台管理端

```bash
cd ui
npm run dev
```
### 5. 启动 H5 商城

```bash
cd h5
npm run dev:h5
```
## 默认账号

执行种子脚本后会创建以下后台账号：

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `123456` | 超级管理员 |
| `service` | `123456` | 客服 |
