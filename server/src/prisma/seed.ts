import { scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import { config } from 'dotenv'
import { resolve } from 'path'

const envPath = resolve(__dirname, '../../.env')
config({
  path: envPath,
})

// 动态导入 PrismaClient，确保在加载 .env 后再初始化客户端，避免导入时的初始化顺序问题
const { PrismaClient } = require('@prisma/client')
const { PrismaMariaDb } = require('@prisma/adapter-mariadb')
const url = process.env.DATABASE_URL ?? 'mysql://root:root@localhost:3306/sm_sys'
const adapter = new PrismaMariaDb(url)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 开始种子数据初始化...\n')

  /* 密码加密 */
  const scryptAsync = promisify(scrypt)
  const salt = 'sm_sys_salt_2026'
  const adminBuf = (await scryptAsync('123456', salt, 64)) as Buffer
  const adminPwd = adminBuf.toString('hex')
  const serviceBuf = (await scryptAsync('123456', salt, 64)) as Buffer
  const servicePwd = serviceBuf.toString('hex')

  /* 权限组（先建，user 外键依赖） */
  const group1 = await prisma.permissionGroups.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: '超级管理员', description: '全部权限' },
  })
  const group2 = await prisma.permissionGroups.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: '客服', description: '订单管理 + 数据看板' },
  })
  console.log('✓ 权限组: 超级管理员 / 客服')

  /* 管理员用户 */
  const admin = await prisma.users.upsert({
    where: { username: 'admin' },
    update: { password: adminPwd },
    create: {
      username: 'admin',
      password: adminPwd,
      nickname: '超级管理员',
      phone: '13800000000',
      groupId: 1,
    },
  })

  const service = await prisma.users.upsert({
    where: { username: 'service' },
    update: { password: servicePwd },
    create: {
      username: 'service',
      password: servicePwd,
      nickname: '客服',
      phone: '13800000001',
      groupId: 2,
    },
  })
  console.log('✓ 管理员用户: admin / 123456 ')
  console.log('✓ 客服用户: service / 123456')

  // 菜单管理已从后台移除，同时清理旧版本遗留的权限关联。
  await prisma.$executeRawUnsafe(
    "DELETE FROM group_menus WHERE menu_id IN (SELECT id FROM menus WHERE permission_code = 'system:menus')",
  )
  await prisma.$executeRawUnsafe(
    "DELETE FROM menu_buttons WHERE menu_id IN (SELECT id FROM menus WHERE permission_code = 'system:menus')",
  )
  await prisma.$executeRawUnsafe(
    "DELETE FROM menus WHERE permission_code = 'system:menus'",
  )

  /* 一级菜单 */
  const menus = [
    {
      id: 1,
      parentId: 0,
      name: '数据看板',
      icon: 'DashboardOutlined',
      permissionCode: 'dashboard',
      sort: 1,
    },
    {
      id: 2,
      parentId: 0,
      name: '图书管理',
      icon: 'BookOutlined',
      permissionCode: 'books',
      sort: 2,
    },
    {
      id: 3,
      parentId: 0,
      name: '订单管理',
      icon: 'ShoppingCartOutlined',
      permissionCode: 'orders',
      sort: 3,
    },
    {
      id: 4,
      parentId: 0,
      name: '系统管理',
      icon: 'SettingOutlined',
      permissionCode: 'system',
      sort: 4,
    },
  ]

  for (const m of menus) {
    await prisma.menus.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    })
  }

  /* 二级菜单 */
  const subMenus = [
    {
      parentId: 1,
      name: '总览',
      path: '/dashboard/Overview',
      component: 'views/dashboard/Overview.vue',
      permissionCode: 'dashboard:overview',
      sort: 1,
    },
    {
      parentId: 1,
      name: '访问统计',
      path: '/dashboard/Analytics',
      component: 'views/dashboard/Analytics.vue',
      permissionCode: 'dashboard:analytics',
      sort: 2,
    },
    {
      parentId: 2,
      name: '图书列表',
      path: '/books/BookList',
      component: 'views/books/BookList.vue',
      permissionCode: 'books:list',
      sort: 1,
    },
    {
      parentId: 2,
      name: '分类管理',
      path: '/books/Categories',
      component: 'views/books/Categories.vue',
      permissionCode: 'books:categories',
      sort: 2,
    },
    {
      parentId: 2,
      name: 'Banner管理',
      path: '/books/Banners',
      component: 'views/books/Banners.vue',
      permissionCode: 'books:banners',
      sort: 3,
    },
    {
      parentId: 3,
      name: '订单列表',
      path: '/orders/OrderList',
      component: 'views/orders/OrderList.vue',
      permissionCode: 'orders:list',
      sort: 1,
    },
    {
      parentId: 3,
      name: '退款管理',
      path: '/orders/Refunds',
      component: 'views/orders/Refunds.vue',
      permissionCode: 'orders:refunds',
      sort: 2,
    },
    {
      parentId: 4,
      name: '权限组',
      path: '/system/Groups',
      component: 'views/system/Groups.vue',
      permissionCode: 'system:groups',
      sort: 1,
    },
    {
      parentId: 4,
      name: 'AI 设置',
      path: '/system/AI',
      component: 'views/system/AI.vue',
      permissionCode: 'system:ai',
      sort: 2,
    },
  ]

  for (const m of subMenus) {
    const existing = await prisma.menus.findFirst({ where: { permissionCode: m.permissionCode } })
    if (existing) {
      await prisma.menus.update({ where: { id: existing.id }, data: m })
    } else {
      await prisma.menus.create({ data: m })
    }
  }

  /* AI 配置默认值：空 API Key 时继续兼容环境变量。 */
  const aiConfigs = [
    {
      key: 'ai_model',
      value: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      type: 'STRING',
      label: 'AI 模型名称',
    },
    {
      key: 'ai_api_key',
      value: '',
      type: 'STRING',
      label: 'AI API Key',
    },
    {
      key: 'ai_api_base_url',
      value: process.env.DEEPSEEK_API_BASE_URL ?? 'https://api.deepseek.com/v1',
      type: 'STRING',
      label: 'AI API 地址',
    },
    { key: 'ai_temperature', value: '0.7', type: 'NUMBER', label: '生成温度' },
    { key: 'ai_max_tokens', value: '2048', type: 'NUMBER', label: '最大输出 Token' },
    {
      key: 'ai_prompt_template',
      value: '你是一个专业的图书推荐助手。你了解各类图书的内容特点，能根据用户的阅读偏好提供个性化推荐。',
      type: 'STRING',
      label: 'AI 提示词模板',
    },
  ]
  for (const item of aiConfigs) {
    await prisma.systemConfigs.upsert({
      where: { key: item.key },
      update: {},
      create: { ...item, group: 'ai' },
    })
  }
  /* 按钮权限 */
  const buttons = [
    { menuId: 6, name: '新增图书', permissionCode: 'books:create' },
    { menuId: 6, name: '编辑图书', permissionCode: 'books:edit' },
    { menuId: 6, name: '删除图书', permissionCode: 'books:delete' },
    { menuId: 7, name: '新增分类', permissionCode: 'categories:create' },
    { menuId: 9, name: '发货', permissionCode: 'orders:ship' },
    { menuId: 10, name: '退款审核', permissionCode: 'orders:refund' },
  ]

  for (const b of buttons) {
    await prisma.menuButtons.upsert({
      where: { menuId_permissionCode: { menuId: b.menuId, permissionCode: b.permissionCode } },
      update: {},
      create: b,
    })
  }
  console.log('✓ 按钮权限: 6 个')

  /* 权限分配：超级管理员 → 全部菜单 */
  const allMenus = await prisma.menus.findMany()
  for (const m of allMenus) {
    await prisma.groupMenus.upsert({
      where: { groupId_menuId: { groupId: 1, menuId: m.id } },
      update: {},
      create: { groupId: 1, menuId: m.id },
    })
  }

  /* 权限分配：客服 → 图书管理+ 订单管理 */
  const csMenuIds = [2, 3, 9, 10, 5, 7, 8, 11] // 图书管理,订单管理+列表+退款
  for (const id of csMenuIds) {
    await prisma.groupMenus.upsert({
      where: { groupId_menuId: { groupId: 2, menuId: id } },
      update: {},
      create: { groupId: 2, menuId: id },
    })
  }
  console.log('✓ 权限分配完成\n')

  console.log('🎉 种子数据初始化完成！')
  console.log('   管理后台: http://localhost:3001')
  console.log('   管理员账号: admin / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
