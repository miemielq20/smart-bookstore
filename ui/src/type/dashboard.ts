export type DashboardSource = 'database' | 'demo' | 'empty'

export interface DashboardMetricSet {
  orders: number
  revenue: number
  activeUsers: number
  newUsers: number
  books: number
  stock: number
  pendingOrders: number
  averageOrderValue: number
}

export interface DashboardOverview {
  source: DashboardSource | 'empty'
  days: number
  period: { from: string; to: string }
  metrics: DashboardMetricSet
  changes: Record<'orders' | 'revenue' | 'activeUsers' | 'newUsers', number>
  trend: Array<{ date: string; label: string; orders: number; revenue: number }>
  statuses: Array<{ key: string; label: string; value: number; color: string }>
  topBooks: Array<{
    rank: number
    id: number
    title: string
    author: string
    category: string
    sales: number
    revenue: number
    views: number
    stock: number
  }>
  categories: Array<{ name: string; value: number }>
}

export interface DashboardTraffic {
  source: DashboardSource | 'empty'
  days: number
  metrics: {
    pageViews: number
    uniqueVisitors: number
    averageDuration: number
    bounceRate: number
  }
  trend: Array<{
    date: string
    label: string
    pageViews: number
    uniqueVisitors: number
    averageDuration: number
  }>
  sources: Array<{ name: string; value: number }>
  topBooks: Array<{ rank: number; title: string; author: string; views: number; totalViews: number }>
}
