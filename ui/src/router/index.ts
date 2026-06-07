import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/Layout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginView.vue'),
      meta: { title: '智慧书城 · 管理后台登录' },
    },
    {
      path: '/',
      component: Layout,
      meta: { requiresAuth: true },
      children: [
        { path: 'dashboard/overview', component: () => import('@/views/dashboard/OverviewView.vue') },
        { path: 'dashboard/analytics', component: () => import('@/views/dashboard/AnalyticsView.vue') },
        { path: 'books/list', component: () => import('@/views/books/BookListView.vue') },
        { path: 'books/categories', component: () => import('@/views/books/CategoryView.vue') },
        { path: 'books/banners', component: () => import('@/views/books/BannerView.vue') },
        { path: 'orders/list', component: () => import('@/views/orders/OrderListView.vue') },
        { path: 'orders/refunds', component: () => import('@/views/orders/RefundView.vue') },
        { path: 'system/groups', component: () => import('@/views/system/GroupView.vue') },
        { path: 'system/menus', component: () => import('@/views/system/MenuView.vue') },
        { path: 'system/ai', component: () => import('@/views/system/AiView.vue') },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

router.beforeEach((to, _from) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    return '/login'
  }
  return true
})

export default router
