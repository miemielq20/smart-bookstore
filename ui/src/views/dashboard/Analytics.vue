<template>
  <div class="analytics-page">
    <section class="page-heading">
      <div>
        <div class="eyebrow">用户行为</div>
        <h2>访问统计</h2>
        <p>了解读者从哪里来、看了什么，以及是否继续阅读。</p>
      </div>
      <div class="heading-actions">
        <div class="range-switch" role="group" aria-label="统计周期">
          <button v-for="option in rangeOptions" :key="option.value" :class="{ active: days === option.value }" type="button" @click="changeRange(option.value)">
            {{ option.label }}
          </button>
        </div>
        <el-button :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </div>
    </section>

    <div class="data-notice" :class="{ demo: isDemo }">
      <el-icon><DataAnalysis /></el-icon>
      <span>{{ isDemo ? '当前显示演示数据；商城产生浏览记录后会自动替换为实时数据。' : '数据来自商城浏览记录，按访问日期实时聚合。' }}</span>
      <span class="notice-time">更新于 {{ updatedAt }}</span>
    </div>

    <div v-loading="loading" class="analytics-content">
      <section class="metric-grid">
        <article class="metric-card olive"><div class="metric-topline"><span>页面浏览量 PV</span><el-icon><TrendCharts /></el-icon></div><strong>{{ traffic.metrics.pageViews.toLocaleString() }}</strong><div class="metric-foot"><span class="positive">按浏览记录统计</span><span>近 {{ days }} 天</span></div></article>
        <article class="metric-card clay"><div class="metric-topline"><span>独立访客 UV</span><el-icon><User /></el-icon></div><strong>{{ traffic.metrics.uniqueVisitors.toLocaleString() }}</strong><div class="metric-foot"><span class="positive">去重用户数</span><span>近 {{ days }} 天</span></div></article>
        <article class="metric-card sage"><div class="metric-topline"><span>平均停留</span><el-icon><Timer /></el-icon></div><strong>{{ formatDuration(traffic.metrics.averageDuration) }}</strong><div class="metric-foot"><span class="positive">每次浏览</span><span>基于 duration</span></div></article>
        <article class="metric-card sand"><div class="metric-topline"><span>跳出率</span><el-icon><Switch /></el-icon></div><strong>{{ traffic.metrics.bounceRate.toFixed(1) }}%</strong><div class="metric-foot"><span :class="traffic.metrics.bounceRate < 40 ? 'positive' : 'negative'">{{ traffic.metrics.bounceRate < 40 ? '表现稳定' : '建议关注' }}</span><span>单次浏览用户</span></div></article>
      </section>

      <section class="panel trend-panel">
        <div class="panel-heading">
          <div><h3>流量趋势</h3><p>PV 与 UV 按天变化</p></div>
          <span class="panel-chip">近 {{ days }} 天</span>
        </div>
        <DashboardTrendChart
          :labels="traffic.trend.map((item) => item.label)"
          :primary-values="traffic.trend.map((item) => item.pageViews)"
          :secondary-values="traffic.trend.map((item) => item.uniqueVisitors)"
          primary-label="PV"
          secondary-label="UV"
          primary-color="#5c7c61"
          secondary-color="#c76d4b"
          :formatter="(value) => value.toLocaleString()"
          aria-label="访问流量趋势图"
        />
      </section>

      <section class="split-grid">
        <article class="panel source-panel">
          <div class="panel-heading"><div><h3>访问来源</h3><p>浏览记录中的 source 字段</p></div><el-icon class="heading-icon"><Share /></el-icon></div>
          <div v-if="traffic.sources.length" class="source-list">
            <div v-for="(item, index) in traffic.sources" :key="item.name" class="source-row">
              <div class="source-label"><span><b>{{ String(index + 1).padStart(2, '0') }}</b>{{ item.name }}</span><strong>{{ item.value.toLocaleString() }}</strong></div>
              <div class="source-track"><span :style="{ width: sourceWidth(item.value) }"></span></div>
            </div>
          </div>
          <el-empty v-else description="暂无访问来源" :image-size="64" />
        </article>

        <article class="panel top-panel">
          <div class="panel-heading"><div><h3>受欢迎图书</h3><p>本周期详情页浏览次数</p></div><el-icon class="heading-icon"><Reading /></el-icon></div>
          <div class="book-list">
            <div v-for="book in traffic.topBooks" :key="book.rank + book.title" class="book-row">
              <span class="book-rank" :class="{ top: book.rank <= 3 }">{{ book.rank }}</span>
              <div class="book-title"><strong>{{ book.title }}</strong><small>{{ book.author }}</small></div>
              <strong class="book-views">{{ book.views.toLocaleString() }}<small>次浏览</small></strong>
            </div>
          </div>
          <el-empty v-if="!traffic.topBooks.length" description="暂无图书访问数据" :image-size="64" />
        </article>
      </section>

      <section class="panel daily-panel">
        <div class="panel-heading"><div><h3>每日明细</h3><p>用于观察峰值和异常波动</p></div><span class="panel-chip">{{ traffic.trend.length }} 天</span></div>
        <div class="table-wrap daily-table-wrap">
          <table>
            <thead><tr><th>日期</th><th>PV</th><th>UV</th><th>平均停留</th><th>PV / UV</th><th>趋势</th></tr></thead>
            <tbody>
              <tr v-for="(item, index) in [...traffic.trend].reverse()" :key="item.date">
                <td class="date-cell">{{ item.date }}</td>
                <td>{{ item.pageViews.toLocaleString() }}</td>
                <td>{{ item.uniqueVisitors.toLocaleString() }}</td>
                <td>{{ formatDuration(item.averageDuration) }}</td>
                <td class="ratio">{{ item.uniqueVisitors ? (item.pageViews / item.uniqueVisitors).toFixed(2) : '-' }}</td>
                <td><span class="trend-dot" :class="trendClass(item.pageViews, traffic.trend[traffic.trend.length - 1 - index]?.pageViews)"></span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { DataAnalysis, Reading, Refresh, Share, Switch, Timer, TrendCharts, User } from '@element-plus/icons-vue'
import { getDashboardTrafficApi } from '@/api/api'
import DashboardTrendChart from '@/components/common/DashboardTrendChart.vue'
import type { DashboardTraffic } from '@/type/dashboard'
import { createDemoTraffic } from './mock'

const rangeOptions = [
  { label: '近 7 天', value: 7 },
  { label: '近 30 天', value: 30 },
  { label: '近 90 天', value: 90 },
]
const days = ref(7)
const loading = ref(false)
const updatedAt = ref('--:--')
const traffic = ref<DashboardTraffic>(createDemoTraffic())
const isDemo = computed(() => traffic.value.source === 'demo')

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    const response = await getDashboardTrafficApi(days.value)
    traffic.value = response.data.source === 'empty' ? createDemoTraffic(days.value) : response.data
  } catch {
    traffic.value = createDemoTraffic(days.value)
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

function sourceWidth(value: number) {
  const max = Math.max(...traffic.value.sources.map((item) => item.value), 1)
  return `${Math.max((value / max) * 100, 4)}%`
}

function formatDuration(seconds: number) {
  const value = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(value / 60)
  return `${minutes}m ${String(value % 60).padStart(2, '0')}s`
}

function trendClass(value: number, latest = value) {
  if (!latest || value === latest) return 'flat'
  return value > latest ? 'up' : 'down'
}
</script>

<style lang="scss" scoped>
.analytics-page { --ink: #2c2416; --muted: #7a6e5e; --faint: #a09282; --paper: #faf7f1; --sage: #5c7c61; min-width: 0; color: var(--ink); }
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
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.metric-card, .panel { border: 1px solid rgba(96, 108, 56, 0.14); border-radius: 12px; background: var(--paper); box-shadow: 0 5px 18px rgba(96, 108, 56, 0.035); }
.metric-card { min-width: 0; padding: 16px 18px 14px; border-top: 3px solid var(--sage); }
.metric-card.clay { border-top-color: #c76d4b; }
.metric-card.sage { border-top-color: #8b9d83; }
.metric-card.sand { border-top-color: #b68a3a; }
.metric-topline, .metric-foot, .panel-heading, .source-label { display: flex; align-items: center; justify-content: space-between; }
.metric-topline { color: var(--muted); font-size: 12px; }
.metric-topline .el-icon { color: var(--sage); }
.metric-card strong { display: block; margin: 9px 0 8px; color: var(--ink); font-size: 27px; font-variant-numeric: tabular-nums; }
.metric-foot { gap: 4px; color: var(--faint); font-size: 10px; white-space: nowrap; }
.positive { color: #5c7c61; }
.negative { color: #b45e4b; }
.panel { padding: 18px 20px; }
.panel-heading { align-items: flex-start; margin-bottom: 14px; gap: 12px; }
.panel-heading h3 { font-size: 15px; font-weight: 700; }
.panel-heading p { margin-top: 4px; color: var(--muted); font-size: 11px; }
.panel-chip { border-radius: 5px; padding: 4px 8px; color: #857967; background: #f0e9dc; font-size: 10px; white-space: nowrap; }
.heading-icon { color: #9b7653; font-size: 18px; }
.trend-panel { margin-bottom: 16px; }
.split-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; margin-bottom: 16px; }
.source-list { display: grid; gap: 17px; padding: 5px 0; }
.source-label { margin-bottom: 7px; color: var(--muted); font-size: 12px; }
.source-label span { display: inline-flex; gap: 10px; align-items: center; }
.source-label b { color: #b68a3a; font-size: 10px; font-variant-numeric: tabular-nums; }
.source-label strong { color: var(--ink); font-variant-numeric: tabular-nums; }
.source-track { height: 8px; overflow: hidden; border-radius: 99px; background: #eee6d8; }
.source-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #8b9d83, #5c7c61); }
.book-list { display: grid; gap: 2px; }
.book-row { display: flex; align-items: center; gap: 11px; min-width: 0; padding: 10px 0; border-bottom: 1px solid #eee7db; }
.book-row:last-child { border-bottom: 0; }
.book-rank { display: grid; place-items: center; width: 22px; height: 22px; flex: none; border-radius: 6px; color: var(--faint); background: #f0e9dc; font-size: 11px; }
.book-rank.top { color: #fff; background: #b68a3a; }
.book-title { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.book-title strong { overflow: hidden; color: var(--ink); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.book-title small { color: var(--faint); font-size: 10px; }
.book-views { display: flex; flex: none; flex-direction: column; align-items: flex-end; color: var(--sage); font-size: 13px; font-variant-numeric: tabular-nums; }
.book-views small { margin-top: 2px; color: var(--faint); font-size: 9px; font-weight: 400; }
.daily-panel { padding-bottom: 8px; }
.daily-table-wrap { margin-top: 0; border: 0; border-radius: 0; background: transparent; }
table { width: 100%; border-collapse: collapse; }
th { padding: 0 10px 10px; color: var(--faint); font-size: 10px; font-weight: 600; text-align: left; }
td { padding: 12px 10px; border-top: 1px solid #eee7db; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.date-cell { color: var(--ink); }
.ratio { color: var(--sage); font-weight: 700; }
.trend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #a09282; }
.trend-dot.up { background: #5c7c61; }
.trend-dot.down { background: #c76d4b; }
@media (max-width: 900px) { .page-heading { align-items: flex-start; flex-direction: column; } .heading-actions { justify-content: flex-start; } .split-grid { grid-template-columns: 1fr; } }
@media (max-width: 620px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .metric-card { padding: 13px 12px; } .metric-foot { display: block; line-height: 1.6; white-space: normal; } .panel { padding: 15px 14px; } .daily-table-wrap { overflow-x: auto; } table { min-width: 560px; } }
</style>
