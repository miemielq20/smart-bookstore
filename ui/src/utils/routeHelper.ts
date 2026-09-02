import type { RouteRecordRaw } from 'vue-router'
import type { MenuNode } from '@/type/api.response'
import Layout from '../views/dashboard/Overview.vue'
// 将后端菜单数据转换为 Vue Router 路由配置
const transformMenuToRoutes = (menus: MenuNode[]): RouteRecordRaw[] => {
  const modules = import.meta.glob('@/views/**/*.vue')
  return menus
    .filter((m) => m.visible === 1)
    .map((m) => {
      const route: RouteRecordRaw = {
        path: m.path || '',
        name: m.permissionCode,
        meta: {
          title: m.name,
          icon: m.icon,
        },
        children: m.children?.length ? transformMenuToRoutes(m.children) : [],
      }

      if (!route.children.length) {
        const key = `/src/views/${m.component?.replace(/^views\//, '')}`
        route.component = modules[key]
      }

      return route
    })
}
export default transformMenuToRoutes
