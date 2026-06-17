<template>
  <el-card class="search-panel" shadow="never">
    <el-form :model="model" inline class="search-form" @submit.prevent>
      <slot />
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="$emit('search')">搜索</el-button>
        <el-button :icon="Refresh" @click="$emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { Refresh, Search } from '@element-plus/icons-vue'

// 通用搜索栏只负责布局和按钮事件，具体搜索字段由页面通过插槽传入。
defineProps<{
  model: Record<string, unknown>
}>()

defineEmits<{
  search: []
  reset: []
}>()
</script>

<style lang="scss" scoped>
.search-panel {
  border: 1px solid rgba(96, 108, 56, 0.12);
  border-radius: 8px;
  /* 页面内搜索模块统一使用后台淡白背景 */
  background: #faf7f1;
  margin-bottom: 16px;
}

.search-form {
  display: flex;
  align-items: center;
  row-gap: 4px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

@media (max-width: 900px) {
  .search-form {
    display: block;
  }
}
</style>
