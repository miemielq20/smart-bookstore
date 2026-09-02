<template>
  <div class="chart-bars">
    <div v-for="(val, idx) in data" :key="idx" class="bar-col">
      <div class="bar" :style="{ height: val + '%' }"></div>
      <div class="bar-label">{{ labels[idx] ?? '-' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: number[]
  labels: string[]
}>()
</script>

<style lang="scss" scoped>
.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 120px;
  padding-top: 8px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  min-height: 8px;
  background: linear-gradient(to top, #5a8f6a, #4a7d5a);
}

.bar-label {
  text-align: center;
  font-size: 10px;
  color: #b0a494;
  margin-top: 6px;
}
</style>
