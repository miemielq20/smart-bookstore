<template>
  <div>
    <div class="page-title">
      <div>
        <h2>数据总览</h2>
        <div class="sub">智慧书城运营数据概览</div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-outline">📅 近30天</button>
        <button class="btn btn-primary">📥 导出报告</button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <StatCard label="今日订单"    :value="128"   change-type="up"      change-text="↑ 12.5% 较昨日" />
      <StatCard label="今日成交额"   value="¥12,680" change-type="up"    change-text="↑ 8.3% 较昨日" />
      <StatCard label="活跃用户"    value="1,256"   change-type="up"      change-text="↑ 3.2% 较昨日" />
      <StatCard label="新增用户"    :value="48"     change-type="up"      change-text="↑ 6.7% 较昨日" />
      <StatCard label="总图书数"    value="12,480"  change-type="neutral" change-text="持平" />
      <StatCard label="待处理订单"   :value="23"     change-type="down"    change-text="↓ 5 项需关注" />
    </div>

    <!-- 图表区 -->
    <div class="chart-section">
      <div class="card-panel">
        <div class="card-header">
          <h3>近7日销售趋势</h3>
          <span class="tag">单位：元</span>
        </div>
        <ChartBars :data="[35,52,48,65,78,55,72]" :labels="['周一','周二','周三','周四','周五','周六','周日']" />
      </div>

      <div class="card-panel">
        <div class="card-header">
          <h3>订单状态分布</h3>
          <span class="tag">当前</span>
        </div>
        <div class="pie-legend">
          <div class="pie-legend-row"><span class="pie-legend-dot" style="background:#059669;"></span><span class="pie-legend-label">已完成</span><span class="pie-legend-val">1,856</span></div>
          <div class="pie-legend-row"><span class="pie-legend-dot" style="background:#3b82f6;"></span><span class="pie-legend-label">已发货</span><span class="pie-legend-val">342</span></div>
          <div class="pie-legend-row"><span class="pie-legend-dot" style="background:#f59e0b;"></span><span class="pie-legend-label">待付款</span><span class="pie-legend-val">89</span></div>
          <div class="pie-legend-row"><span class="pie-legend-dot" style="background:#ef4444;"></span><span class="pie-legend-label">退款中</span><span class="pie-legend-val">12</span></div>
          <div class="pie-legend-row"><span class="pie-legend-dot" style="background:#94a3b8;"></span><span class="pie-legend-label">已取消</span><span class="pie-legend-val">67</span></div>
        </div>
      </div>
    </div>

    <!-- 热销 Top 5 -->
    <div class="card-panel">
      <div class="card-header">
        <h3>热销图书 TOP 5</h3>
        <span class="tag">本月</span>
      </div>
      <div class="table-wrap" style="border:none;border-radius:0;margin-top:0;">
        <table>
          <thead><tr><th>排名</th><th>书名</th><th>作者</th><th>分类</th><th>销量</th><th>销售额</th></tr></thead>
          <tbody>
            <tr><td><strong>1</strong></td><td>深入理解计算机系统</td><td>Randal Bryant</td><td>计算机</td><td>1,280</td><td>¥177,920</td></tr>
            <tr><td><strong>2</strong></td><td>百年孤独</td><td>加西亚·马尔克斯</td><td>文学小说</td><td>956</td><td>¥53,536</td></tr>
            <tr><td><strong>3</strong></td><td>人类简史</td><td>尤瓦尔·赫拉利</td><td>人文社科</td><td>842</td><td>¥58,940</td></tr>
            <tr><td><strong>4</strong></td><td>算法导论</td><td>Thomas Cormen</td><td>计算机</td><td>721</td><td>¥97,335</td></tr>
            <tr><td><strong>5</strong></td><td>设计的觉醒</td><td>原研哉</td><td>生活百科</td><td>635</td><td>¥41,275</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatCard from '@/components/common/StatCard.vue'
import ChartBars from '@/components/common/ChartBars.vue'
</script>
