import type { DashboardOverview, DashboardTraffic } from '@/type/dashboard'

function dayLabels(days: number) {
  const now = new Date()
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - days + index + 1)
    return {
      date: date.toISOString(),
      label: `${date.getMonth() + 1}/${date.getDate()}`,
    }
  })
}

export function createDemoOverview(days = 7): DashboardOverview {
  const values = [
    { orders: 32, revenue: 4260 },
    { orders: 41, revenue: 5830 },
    { orders: 36, revenue: 4910 },
    { orders: 58, revenue: 8240 },
    { orders: 64, revenue: 9320 },
    { orders: 52, revenue: 7480 },
    { orders: 71, revenue: 10680 },
  ]
  const trend = dayLabels(days).map((day, index) => {
    const source = values[index % values.length] ?? values[0]!
    return { ...day, ...source }
  })
  return {
    source: 'demo',
    days,
    period: { from: trend[0]?.date ?? '', to: new Date().toISOString() },
    metrics: {
      orders: 354,
      revenue: 50720,
      activeUsers: 286,
      newUsers: 48,
      books: 1248,
      stock: 8630,
      pendingOrders: 42,
      averageOrderValue: 143.28,
    },
    changes: { orders: 12.5, revenue: 8.3, activeUsers: 6.7, newUsers: 14.2 },
    trend,
    statuses: [
      { key: 'COMPLETED', label: '已完成', value: 214, color: '#5c7c61' },
      { key: 'SHIPPED', label: '待收货', value: 63, color: '#9b7653' },
      { key: 'PAID', label: '待发货', value: 31, color: '#b68a3a' },
      { key: 'PENDING', label: '待付款', value: 18, color: '#c76d4b' },
      { key: 'AFTER_SALE', label: '售后中', value: 8, color: '#8f5d67' },
      { key: 'CANCELLED', label: '已取消', value: 20, color: '#9a9b8f' },
    ],
    topBooks: [
      { rank: 1, id: 1, title: '深入理解计算机系统', author: 'Randal Bryant', category: '计算机', sales: 1280, revenue: 177920, views: 4820, stock: 500 },
      { rank: 2, id: 2, title: '百年孤独', author: '加西亚·马尔克斯', category: '文学小说', sales: 956, revenue: 53536, views: 3910, stock: 320 },
      { rank: 3, id: 3, title: '人类简史', author: '尤瓦尔·赫拉利', category: '人文社科', sales: 842, revenue: 58940, views: 3640, stock: 240 },
      { rank: 4, id: 4, title: '算法导论', author: 'Thomas Cormen', category: '计算机', sales: 721, revenue: 97335, views: 2870, stock: 180 },
      { rank: 5, id: 5, title: '设计的觉醒', author: '原研哉', category: '生活百科', sales: 635, revenue: 41275, views: 2410, stock: 96 },
    ],
    categories: [
      { name: '计算机', value: 2380 },
      { name: '文学小说', value: 1760 },
      { name: '人文社科', value: 1420 },
      { name: '生活百科', value: 980 },
      { name: '经济管理', value: 740 },
    ],
  }
}

export function createDemoTraffic(days = 7): DashboardTraffic {
  const trend = dayLabels(days).map((day, index) => ({
    ...day,
    pageViews: [420, 580, 510, 720, 806, 634, 752][index % 7] ?? 0,
    uniqueVisitors: [164, 218, 196, 274, 302, 248, 286][index % 7] ?? 0,
    averageDuration: [238, 254, 247, 269, 281, 263, 272][index % 7] ?? 0,
  }))
  return {
    source: 'demo',
    days,
    metrics: { pageViews: 4422, uniqueVisitors: 1688, averageDuration: 262, bounceRate: 31.8 },
    trend,
    sources: [
      { name: '首页推荐', value: 1680 },
      { name: '搜索', value: 1240 },
      { name: '分类页', value: 860 },
      { name: '详情页推荐', value: 510 },
      { name: '直接访问', value: 132 },
    ],
    topBooks: [
      { rank: 1, title: '深入理解计算机系统', author: 'Randal Bryant', views: 4820, totalViews: 4820 },
      { rank: 2, title: '百年孤独', author: '加西亚·马尔克斯', views: 3910, totalViews: 3910 },
      { rank: 3, title: '人类简史', author: '尤瓦尔·赫拉利', views: 3640, totalViews: 3640 },
      { rank: 4, title: '算法导论', author: 'Thomas Cormen', views: 2870, totalViews: 2870 },
      { rank: 5, title: '设计的觉醒', author: '原研哉', views: 2410, totalViews: 2410 },
    ],
  }
}
