<template>
  <div>
    <div class="page-title">
      <div>
        <h2>访问统计</h2>
        <div class="sub">用户访问与流量分析</div>
      </div>
    </div>

    <div class="stats-grid">
      <StatCard label="今日 PV" value="4,268" change-type="up" change-text="↑ 5.2%" />
      <StatCard label="今日 UV" value="1,534" change-type="up" change-text="↑ 3.8%" />
      <StatCard label="平均停留" value="4m32s" change-type="up" change-text="↑ 12s" />
      <StatCard label="跳出率" value="32.1%" change-type="down" change-text="↓ 1.4%" />
    </div>

    <div class="card-panel">
      <div class="card-header">
        <h3>近7日流量趋势</h3>
        <span class="tag">PV / UV</span>
      </div>
      <ChartBars :data="[42,58,51,72,80,63,75]" :labels="['周一','周二','周三','周四','周五','周六','周日']" style="height:140px;" />
    </div>
  </div>
</template>

<script setup lang="ts">
import StatCard from '@/components/common/StatCard.vue'
import ChartBars from '@/components/common/ChartBars.vue'
</script>
