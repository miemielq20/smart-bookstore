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
  const adminBuf = await scryptAsync('123456', salt, 64) as Buffer
  const adminPwd = adminBuf.toString('hex')
  const serviceBuf = await scryptAsync('123456', salt, 64) as Buffer
  const servicePwd = serviceBuf.toString('hex')

  /* 权限组（先建，user 外键依赖） */
  const group1 = await prisma.permissionGroup.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: '超级管理员', description: '全部权限' },
  })
  const group2 = await prisma.permissionGroup.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: '客服', description: '订单管理 + 数据看板' },
  })
  console.log('✓ 权限组: 超级管理员 / 客服')

  /* 管理员用户 */
  const admin = await prisma.user.upsert({
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

  const service = await prisma.user.upsert({
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

  /* 一级菜单 */
  const menus = [
    { id: 1, parentId: 0, name: '数据看板', icon: 'DashboardOutlined', permissionCode: 'dashboard', sort: 1 },
    { id: 2, parentId: 0, name: '图书管理', icon: 'BookOutlined', permissionCode: 'books', sort: 2 },
    { id: 3, parentId: 0, name: '订单管理', icon: 'ShoppingCartOutlined', permissionCode: 'orders', sort: 3 },
    { id: 4, parentId: 0, name: '系统管理', icon: 'SettingOutlined', permissionCode: 'system', sort: 4 },
  ]

  for (const m of menus) {
    await prisma.menu.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    })
  }

  /* 二级菜单 */
  const subMenus = [
    { parentId: 1, name: '总览', path: '/dashboard/overview', component: 'views/dashboard/overview.vue', permissionCode: 'dashboard:overview', sort: 1 },
    { parentId: 1, name: '访问统计', path: '/dashboard/analytics', component: 'views/dashboard/analytics.vue', permissionCode: 'dashboard:analytics', sort: 2 },
    { parentId: 2, name: '图书列表', path: '/books/list', component: 'views/books/list.vue', permissionCode: 'books:list', sort: 1 },
    { parentId: 2, name: '分类管理', path: '/books/categories', component: 'views/books/categories.vue', permissionCode: 'books:categories', sort: 2 },
    { parentId: 2, name: 'Banner管理', path: '/books/banners', component: 'views/books/banners.vue', permissionCode: 'books:banners', sort: 3 },
    { parentId: 3, name: '订单列表', path: '/orders/list', component: 'views/orders/list.vue', permissionCode: 'orders:list', sort: 1 },
    { parentId: 3, name: '退款管理', path: '/orders/refunds', component: 'views/orders/refunds.vue', permissionCode: 'orders:refunds', sort: 2 },
    { parentId: 4, name: '权限组', path: '/system/groups', component: 'views/system/groups.vue', permissionCode: 'system:groups', sort: 1 },
    { parentId: 4, name: '菜单管理', path: '/system/menus', component: 'views/system/menus.vue', permissionCode: 'system:menus', sort: 2 },
    { parentId: 4, name: 'AI 设置', path: '/system/ai', component: 'views/system/ai.vue', permissionCode: 'system:ai', sort: 3 },
  ]

  for (const m of subMenus) {
    const existing = await prisma.menu.findFirst({ where: { permissionCode: m.permissionCode } })
    if (!existing) {
      await prisma.menu.create({ data: m })
    }
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
    await prisma.menuButton.upsert({ where: { menuId_permissionCode: { menuId: b.menuId, permissionCode: b.permissionCode } }, update: {}, create: b })
  }
  console.log('✓ 按钮权限: 6 个')

  /* 权限分配：超级管理员 → 全部菜单 */
  const allMenus = await prisma.menu.findMany()
  for (const m of allMenus) {
    await prisma.groupMenu.upsert({
      where: { groupId_menuId: { groupId: 1, menuId: m.id } },
      update: {},
      create: { groupId: 1, menuId: m.id },
    })
  }

  /* 权限分配：客服 → 数据看板 + 订单管理 */
  const csMenuIds = [1, 5, 6, 3, 9, 10] // 数据看板总览+统计，订单管理+列表+退款
  for (const id of csMenuIds) {
    await prisma.groupMenu.upsert({
      where: { groupId_menuId: { groupId: 2, menuId: id } },
      update: {},
      create: { groupId: 2, menuId: id },
    })
  }
  console.log('✓ 权限分配完成\n')

  console.log('🎉 种子数据初始化完成！')
  console.log('   管理后台: http://localhost:3000')
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
