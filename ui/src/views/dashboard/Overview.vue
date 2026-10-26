<template>
  <div class="dashboard-page">
    <section class="page-heading">
      <div>
        <div class="eyebrow">运营看板</div>
        <h2>数据总览</h2>
        <p>用订单、库存和用户行为，快速判断今天该做什么。</p>
      </div>
      <div class="heading-actions">
        <div class="range-switch" role="group" aria-label="统计周期">
          <button
            v-for="option in rangeOptions"
            :key="option.value"
            :class="{ active: days === option.value }"
            type="button"
            @click="changeRange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
        <el-button :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
        <el-button type="primary" :icon="Download" @click="exportReport">导出报告</el-button>
      </div>
    </section>

    <div class="data-notice" :class="{ demo: isDemo }">
      <el-icon><DataAnalysis /></el-icon>
      <span>{{ isDemo ? '当前显示演示数据，连接数据库并产生订单后会自动替换为实时数据。' : '数据来自数据库实时聚合，统计周期为最近 ' + days + ' 天。' }}</span>
      <span class="notice-time">更新于 {{ updatedAt }}</span>
    </div>

    <div v-loading="loading" class="dashboard-content">
      <section class="metric-grid">
        <article v-for="metric in metricCards" :key="metric.label" class="metric-card" :class="metric.tone">
          <div class="metric-topline">
            <span>{{ metric.label }}</span>
            <el-icon :size="18"><component :is="metric.icon" /></el-icon>
          </div>
          <strong>{{ metric.value }}</strong>
          <div class="metric-foot">
            <span v-if="metric.change !== undefined" :class="changeClass(metric.change)">
              {{ changeText(metric.change) }}
            </span>
            <span v-else>{{ metric.note }}</span>
            <span>{{ metric.helper }}</span>
          </div>
        </article>
      </section>

      <section class="primary-grid">
        <article class="panel trend-panel">
          <div class="panel-heading">
            <div>
              <h3>销售趋势</h3>
              <p>订单量与成交额按天汇总</p>
            </div>
            <span class="panel-chip">近 {{ days }} 天</span>
          </div>
          <DashboardTrendChart
            :labels="overview.trend.map((item) => item.label)"
            :primary-values="overview.trend.map((item) => item.revenue)"
            :secondary-values="overview.trend.map((item) => item.orders)"
            primary-label="成交额"
            secondary-label="订单数"
            :formatter="formatChartValue"
            aria-label="销售趋势图"
          />
        </article>

        <article class="panel status-panel">
          <div class="panel-heading">
            <div>
              <h3>订单状态</h3>
              <p>当前全部订单分布</p>
            </div>
            <span class="status-total">{{ statusTotal }} 单</span>
          </div>
          <div class="status-layout">
            <div class="donut" :style="donutStyle" aria-label="订单状态分布图">
              <div class="donut-hole"><strong>{{ statusTotal }}</strong><span>全部订单</span></div>
            </div>
            <div class="status-list">
              <div v-for="item in overview.statuses" :key="item.key" class="status-row">
                <span class="status-name"><i :style="{ background: item.color }"></i>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="secondary-grid">
        <article class="panel category-panel">
          <div class="panel-heading">
            <div>
              <h3>分类销量</h3>
              <p>按图书累计销量聚合</p>
            </div>
            <el-icon class="heading-icon"><Collection /></el-icon>
          </div>
          <div v-if="overview.categories.length" class="category-list">
            <div v-for="item in overview.categories" :key="item.name" class="category-row">
              <div class="category-label"><span>{{ item.name }}</span><strong>{{ item.value.toLocaleString() }}</strong></div>
              <div class="category-track"><span :style="{ width: categoryWidth(item.value) }"></span></div>
            </div>
          </div>
          <el-empty v-else description="暂无分类销量" :image-size="64" />
        </article>

        <article class="panel insight-panel">
          <div class="panel-heading">
            <div>
              <h3>运营提醒</h3>
              <p>根据当前库存与订单状态生成</p>
            </div>
            <el-icon class="heading-icon"><Bell /></el-icon>
          </div>
          <div class="insight-list">
            <div class="insight-item" :class="{ alert: overview.metrics.pendingOrders > 30 }">
              <span class="insight-icon"><el-icon><Clock /></el-icon></span>
              <div><strong>{{ overview.metrics.pendingOrders }} 笔订单待处理</strong><p>优先处理付款、发货和售后订单。</p></div>
            </div>
            <div class="insight-item" :class="{ alert: overview.metrics.stock < 500 }">
              <span class="insight-icon"><el-icon><Box /></el-icon></span>
              <div><strong>可售库存 {{ overview.metrics.stock.toLocaleString() }} 本</strong><p>{{ lowStockText }}</p></div>
            </div>
            <div class="insight-item">
              <span class="insight-icon"><el-icon><User /></el-icon></span>
              <div><strong>{{ overview.metrics.newUsers }} 位新用户</strong><p>最近 {{ days }} 天完成注册。</p></div>
            </div>
          </div>
        </article>
      </section>

      <section class="panel table-panel">
        <div class="panel-heading">
          <div>
            <h3>热销图书</h3>
            <p>按累计销量排序，帮助安排补货与推荐位</p>
          </div>
          <span class="panel-chip">TOP {{ overview.topBooks.length }}</span>
        </div>
        <div class="table-wrap dashboard-table-wrap">
          <table>
            <thead><tr><th>排名</th><th>图书</th><th>分类</th><th>销量</th><th>销售额</th><th>库存</th><th>浏览</th></tr></thead>
            <tbody>
              <tr v-for="book in overview.topBooks" :key="book.id">
                <td><span class="rank" :class="{ top: book.rank <= 3 }">{{ String(book.rank).padStart(2, '0') }}</span></td>
                <td><div class="book-cell"><strong>{{ book.title }}</strong><small>{{ book.author }}</small></div></td>
                <td><span class="category-tag">{{ book.category }}</span></td>
                <td>{{ book.sales.toLocaleString() }}</td>
                <td class="amount">¥{{ formatMoney(book.revenue) }}</td>
                <td><span :class="{ 'stock-low': book.stock < 50 }">{{ book.stock.toLocaleString() }}</span></td>
                <td class="muted-number">{{ book.views.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
          <el-empty v-if="!overview.topBooks.length" description="暂无热销图书" :image-size="72" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Bell, Box, Clock, Collection, DataAnalysis, Download, Refresh, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getDashboardOverviewApi } from '@/api/api'
import DashboardTrendChart from '@/components/common/DashboardTrendChart.vue'
import type { DashboardOverview } from '@/type/dashboard'
import { createDemoOverview } from './mock'

const rangeOptions = [
  { label: '近 7 天', value: 7 },
  { label: '近 30 天', value: 30 },
  { label: '近 90 天', value: 90 },
]
const days = ref(7)
const loading = ref(false)
const updatedAt = ref('--:--')
const overview = ref<DashboardOverview>(createDemoOverview())

const isDemo = computed(() => overview.value.source === 'demo')
const statusTotal = computed(() => overview.value.statuses.reduce((sum, item) => sum + item.value, 0))
const donutStyle = computed(() => {
  if (!statusTotal.value) return { background: '#e8dfcf' }
  let cursor = 0
  const stops = overview.value.statuses.map((item) => {
    const start = cursor
    cursor += (item.value / statusTotal.value) * 100
    return `${item.color} ${start}% ${cursor}%`
  })
  return { background: `conic-gradient(${stops.join(', ')})` }
})
const lowStockText = computed(() => (overview.value.metrics.stock < 500 ? '库存偏低，请检查补货计划。' : '整体库存充足，继续关注畅销书。'))

const metricCards = computed(() => [
  { label: '成交额', value: `¥${formatMoney(overview.value.metrics.revenue)}`, change: overview.value.changes.revenue, helper: `近 ${days.value} 天`, icon: DataAnalysis, tone: 'olive' },
  { label: '订单量', value: overview.value.metrics.orders.toLocaleString(), change: overview.value.changes.orders, helper: '已创建订单', icon: Collection, tone: 'clay' },
  { label: '活跃用户', value: overview.value.metrics.activeUsers.toLocaleString(), change: overview.value.changes.activeUsers, helper: '产生有效订单', icon: User, tone: 'sage' },
  { label: '新增用户', value: overview.value.metrics.newUsers.toLocaleString(), change: overview.value.changes.newUsers, helper: `近 ${days.value} 天`, icon: Bell, tone: 'sand' },
  { label: '在售图书', value: overview.value.metrics.books.toLocaleString(), note: '实时库存', helper: `${overview.value.metrics.stock.toLocaleString()} 本库存`, icon: Box, tone: 'ink' },
  { label: '待处理订单', value: overview.value.metrics.pendingOrders.toLocaleString(), note: '需要关注', helper: '付款 / 发货 / 售后', icon: Clock, tone: overview.value.metrics.pendingOrders > 30 ? 'alert' : 'ink' },
])

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    const response = await getDashboardOverviewApi(days.value)
    overview.value = response.data.source === 'empty' ? createDemoOverview(days.value) : response.data
  } catch {
    overview.value = createDemoOverview(days.value)
  } finally {
    updatedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    loading.value = false
  }
}

function changeRange(value: number) {
  if (days.value === value) return
  days.value = value
  loadData()
}

function changeText(value: number) {
  if (value === 0) return '— 与上期持平'
  return `${value > 0 ? '↑' : '↓'} ${Math.abs(value).toFixed(1)}% 较上期`
}

function changeClass(value: number) {
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
}

function categoryWidth(value: number) {
  const max = Math.max(...overview.value.categories.map((item) => item.value), 1)
  return `${Math.max((value / max) * 100, 4)}%`
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatChartValue(value: number) {
  return value > 1000 ? `¥${Math.round(value).toLocaleString()}` : `${value} 单`
}

function exportReport() {
  const rows = [
    ['图书', '分类', '销量', '销售额', '库存'],
    ...overview.value.topBooks.map((book) => [book.title, book.category, book.sales, book.revenue, book.stock]),
  ]
  const csv = `\uFEFF${rows.map((row) => row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(',')).join('\n')}`
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  link.download = `smart-bookstore-dashboard-${days.value}d.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('报告已导出')
}
</script>

<style lang="scss" scoped>
.dashboard-page {
  --ink: #2c2416;
  --muted: #7a6e5e;
  --faint: #a09282;
  --line: #e8dfcf;
  --paper: #faf7f1;
  --sage: #5c7c61;
  min-width: 0;
  color: var(--ink);
}

.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.eyebrow { color: #9b7653; font-size: 11px; letter-spacing: 1.4px; font-weight: 700; }
h2, h3, p { margin: 0; }
h2 { margin-top: 5px; font-size: 27px; letter-spacing: -0.6px; }
.page-heading p { margin-top: 7px; color: var(--muted); font-size: 13px; }
.heading-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.range-switch { display: inline-flex; padding: 3px; border: 1px solid #ded3c0; border-radius: 8px; background: rgba(250, 247, 241, 0.78); }
.range-switch button { border: 0; border-radius: 6px; padding: 6px 10px; color: var(--muted); background: transparent; font: inherit; font-size: 12px; cursor: pointer; }
.range-switch button.active { color: #fff; background: var(--sage); }
.data-notice { display: flex; align-items: center; gap: 8px; min-height: 34px; padding: 0 12px; margin-bottom: 16px; border: 1px solid rgba(92, 124, 97, 0.2); border-radius: 8px; background: rgba(92, 124, 97, 0.07); color: #4d6c53; font-size: 12px; }
.data-notice.demo { border-color: rgba(182, 138, 58, 0.28); background: rgba(182, 138, 58, 0.09); color: #8a682e; }
.notice-time { margin-left: auto; color: var(--faint); white-space: nowrap; }
.metric-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.metric-card, .panel { border: 1px solid rgba(96, 108, 56, 0.14); border-radius: 12px; background: var(--paper); box-shadow: 0 5px 18px rgba(96, 108, 56, 0.035); }
.metric-card { min-width: 0; padding: 15px 16px 14px; border-top: 3px solid var(--sage); }
.metric-card.clay { border-top-color: #c76d4b; }
.metric-card.sage { border-top-color: #8b9d83; }
.metric-card.sand { border-top-color: #b68a3a; }
.metric-card.ink { border-top-color: #7a6e5e; }
.metric-card.alert { border-top-color: #a85648; }
.metric-topline, .metric-foot, .panel-heading, .category-label, .status-row { display: flex; align-items: center; justify-content: space-between; }
.metric-topline { color: var(--muted); font-size: 12px; }
.metric-topline .el-icon { color: var(--sage); }
.metric-card strong { display: block; margin: 9px 0 8px; overflow: hidden; color: var(--ink); font-size: clamp(20px, 2vw, 27px); font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; }
.metric-foot { gap: 4px; color: var(--faint); font-size: 10px; white-space: nowrap; }
.metric-foot > span:last-child { overflow: hidden; text-overflow: ellipsis; }
.positive { color: #5c7c61; }
.negative { color: #b45e4b; }
.neutral { color: var(--faint); }
.primary-grid { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.85fr); gap: 16px; margin-bottom: 16px; }
.secondary-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr); gap: 16px; margin-bottom: 16px; }
.panel { padding: 18px 20px; }
.panel-heading { align-items: flex-start; margin-bottom: 14px; gap: 12px; }
.panel-heading h3 { font-size: 15px; font-weight: 700; }
.panel-heading p { margin-top: 4px; color: var(--muted); font-size: 11px; }
.panel-chip, .status-total { border-radius: 5px; padding: 4px 8px; color: #857967; background: #f0e9dc; font-size: 10px; white-space: nowrap; }
.status-total { padding-right: 0; color: var(--sage); background: transparent; font-weight: 700; }
.heading-icon { color: #9b7653; font-size: 18px; }
.status-layout { display: grid; grid-template-columns: 150px minmax(0, 1fr); align-items: center; gap: 20px; min-height: 190px; }
.donut { display: grid; place-items: center; width: 150px; height: 150px; border-radius: 50%; }
.donut-hole { display: flex; width: 94px; height: 94px; flex-direction: column; align-items: center; justify-content: center; border-radius: 50%; background: var(--paper); }
.donut-hole strong { font-size: 22px; font-variant-numeric: tabular-nums; }
.donut-hole span { margin-top: 3px; color: var(--faint); font-size: 10px; }
.status-list { display: grid; gap: 10px; }
.status-row { color: var(--muted); font-size: 12px; }
.status-row strong { color: var(--ink); font-variant-numeric: tabular-nums; }
.status-name { display: inline-flex; align-items: center; gap: 8px; }
.status-name i { width: 8px; height: 8px; border-radius: 50%; }
.category-list { display: grid; gap: 17px; padding: 7px 0 5px; }
.category-label { margin-bottom: 7px; color: var(--muted); font-size: 12px; }
.category-label strong { color: var(--ink); font-variant-numeric: tabular-nums; }
.category-track { height: 8px; overflow: hidden; border-radius: 99px; background: #eee6d8; }
.category-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #8b9d83, #5c7c61); }
.insight-list { display: grid; gap: 9px; }
.insight-item { display: flex; align-items: flex-start; gap: 10px; padding: 11px 10px; border: 1px solid transparent; border-radius: 9px; background: #f3eee5; }
.insight-item.alert { border-color: rgba(199, 109, 75, 0.28); background: #fbede7; }
.insight-icon { display: grid; place-items: center; width: 28px; height: 28px; flex: none; border-radius: 7px; color: var(--sage); background: #e4ebe0; }
.insight-item.alert .insight-icon { color: #b45e4b; background: #f6d7ca; }
.insight-item strong { display: block; font-size: 12px; }
.insight-item p { margin-top: 4px; color: var(--muted); font-size: 11px; line-height: 1.45; }
.table-panel { padding-bottom: 8px; }
.dashboard-table-wrap { margin-top: 0; border: 0; border-radius: 0; background: transparent; }
table { width: 100%; border-collapse: collapse; }
th { padding: 0 10px 10px; color: var(--faint); font-size: 10px; font-weight: 600; text-align: left; letter-spacing: 0.3px; }
td { padding: 12px 10px; border-top: 1px solid #eee7db; color: var(--muted); font-size: 12px; }
tr:hover td { background: rgba(139, 157, 131, 0.08); }
.rank { color: var(--faint); font-size: 11px; font-variant-numeric: tabular-nums; }
.rank.top { color: #b68a3a; font-weight: 800; }
.book-cell { display: flex; flex-direction: column; gap: 3px; min-width: 170px; }
.book-cell strong { overflow: hidden; color: var(--ink); text-overflow: ellipsis; white-space: nowrap; }
.book-cell small { color: var(--faint); font-size: 10px; }
.category-tag { padding: 4px 7px; border-radius: 5px; color: #6d7e67; background: #e7ede3; font-size: 10px; }
.amount { color: var(--sage); font-weight: 700; font-variant-numeric: tabular-nums; }
.muted-number { color: var(--faint); font-variant-numeric: tabular-nums; }
.stock-low { color: #b45e4b; font-weight: 700; }
@media (max-width: 1200px) { .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 860px) { .page-heading { align-items: flex-start; flex-direction: column; } .heading-actions { justify-content: flex-start; } .primary-grid, .secondary-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .metric-card { padding: 13px 12px; } .metric-foot { display: block; line-height: 1.6; white-space: normal; } .status-layout { grid-template-columns: 1fr; justify-items: center; } .status-list { width: 100%; } .panel { padding: 15px 14px; } .dashboard-table-wrap { overflow-x: auto; } table { min-width: 660px; } }
</style>
