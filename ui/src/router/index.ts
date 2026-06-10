import { createRouter, createWebHistory } from "vue-router"
import Layout from "@/Layout.vue"
import { getMenusApi } from "@/api/api"
import transformMenuToRoutes from "@/utils/routeHelper"
import { useRouterStore } from "@/stores/route"
import { useMenuStore } from "@/stores/sider"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/login/LoginView.vue"),
      meta: { title: "管理后台登录" },
    },
    {
      path: "/",
      name: "Layout",
      component: Layout,
      meta: { requiresAuth: true },
      children: [],
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: (to) => ({ path: "/", query: { _r: to.path } }),
    },
  ],
})

router.beforeEach(async (to) => {
  const token = localStorage.getItem("token")

  /* ====== 登录页：有 token 直接进后台 ====== */
  if (to.path === "/login") {
    return token ? "/" : true
  }

  /* ====== 其他页面：没 token 跳登录 ====== */
  if (!token) {
    return "/login"
  }

  /* ====== 加载菜单 + 注册动态路由（仅首次） ====== */
  const menuStore = useMenuStore()
  const routeStore = useRouterStore()

  if (!routeStore.routerReady) {
    if (!menuStore.menus.length) {
      await menuStore.initMenus()
    }
    const menus = await getMenusApi()
    const routes = transformMenuToRoutes(menus.data)
    routes.forEach((r) => router.addRoute("Layout", r))
    routeStore.routerReady = true
  }

  /* ====== 根路径：还原刷新前的页面 或 跳第一个菜单 ====== */
  if (to.path === "/") {
    const redirectPath = to.query._r as string
    if (redirectPath) {
      const resolved = router.resolve(redirectPath)
      if (resolved.matched.length > 0) {
        return redirectPath
      }
    }
    const first = menuStore.menus[0]?.children?.[0]
    if (first?.path) {
      return first.path
    }
  }

  return true
})

export default router