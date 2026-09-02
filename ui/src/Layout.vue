<template>
  <div class="admin-layout">
    <Sidebar />
    <div class="main">
      <Header />
      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'
</script>

<style lang="scss" scoped>
$bg-page: #f2ede4;

.admin-layout {
  display: flex;
  min-height: 100vh;
  background: $bg-page;
}

.main {
  margin-left: 240px;
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  min-width: 0;
  padding: 24px 28px;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #b0a494;
    border-radius: 2px;
  }
}
</style>

<!-- 全局样式（admin 页面共享） -->
<style lang="scss">
$bg-card: #faf7f1;
$bg-white: #ffffff;
$bg-page: #f2ede4;
$border: #e5dcc8;
$border-light: #efe9dc;
$text-primary: #2c2416;
$text-secondary: #7a6e5e;
$text-muted: #b0a494;
$green-800: #2d5a3d;
$green-900: #1a3a28;
$green-light: rgba(45, 90, 61, 0.06);
$radius: 10px;
$radius-lg: 14px;
$green-500: #5a8f6a;
$green-600: #4a7d5a;

/* 页面标题 */
.page-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  h2 {
    font-size: 20px;
    font-weight: 700;
    color: $text-primary;
  }
  .sub {
    font-size: 13px;
    color: $text-secondary;
    margin-top: 2px;
  }
}

/* 卡片面板 */
.card-panel {
  background: $bg-card;
  border: 1px solid $border-light;
  border-radius: $radius-lg;
  padding: 20px 22px;
}

/* 按钮 */
.btn {
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-primary {
  background: $green-800;
  color: #fff;
  &:hover {
    background: $green-900;
  }
}
.btn-outline {
  background: $bg-card;
  border: 1px solid $border;
  color: $text-secondary;
  &:hover {
    border-color: $text-muted;
    color: $text-primary;
  }
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

/* 统计卡片 */
.stat-card {
  background: $bg-card;
  border: 1px solid $border-light;
  border-radius: $radius;
  padding: 18px 20px;

  .label {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 6px;
  }
  .value {
    font-size: 26px;
    font-weight: 700;
    color: $green-800;
  }
  .change {
    font-size: 11px;
    margin-top: 4px;
  }
  .change.up {
    color: #059669;
  }
  .change.down {
    color: #dc2626;
  }
}

/* 表格容器 */
.table-wrap {
  background: $bg-card;
  border: 1px solid $border-light;
  border-radius: $radius-lg;
  overflow: hidden;
  margin-top: 16px;

  table {
    width: 100%;
    border-collapse: collapse;
  }
  th {
    padding: 12px 18px;
    text-align: left;
    font-size: 12px;
    font-weight: 500;
    color: $text-muted;
    background: $border-light;
    border-bottom: 1px solid $border;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  td {
    padding: 12px 18px;
    font-size: 13px;
    color: $text-primary;
    border-bottom: 1px solid $border-light;
  }
  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: $green-light;
  }
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-tag-green {
  background: #ecfdf5;
  color: #059669;
}
.status-tag-yellow {
  background: #fef3c7;
  color: #b45309;
}
.status-tag-blue {
  background: #eff6ff;
  color: #2563eb;
}
.status-tag-red {
  background: #fef2f2;
  color: #dc2626;
}
.status-tag-gray {
  background: #f1f5f9;
  color: #64748b;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;

  input,
  select {
    padding: 8px 12px;
    font-size: 13px;
    font-family: inherit;
    border: 1px solid $border;
    border-radius: 6px;
    background: $bg-card;
    color: $text-primary;
    outline: none;
    min-width: 140px;
    &:focus {
      border-color: $green-500;
    }
  }
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px 0;

  .page {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid $border-light;
    background: $bg-card;
    color: $text-secondary;
    transition: all 0.12s;
    min-width: 32px;
    text-align: center;
    &:hover {
      border-color: $text-muted;
    }
  }
  .page-active {
    background: $green-800;
    color: #fff;
    border-color: $green-800;
  }
}

/* 表单面板 */
.form-panel {
  background: $bg-card;
  border: 1px solid $border-light;
  border-radius: $radius-lg;
  padding: 24px;
  max-width: 600px;

  .form-group {
    margin-bottom: 18px;
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 6px;
      color: $text-primary;
    }
    input,
    textarea,
    select {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid $border;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      background: $bg-white;
      color: $text-primary;
      outline: none;
      transition: border-color 0.15s;
      &:focus {
        border-color: $green-500;
      }
    }
    textarea {
      min-height: 80px;
      resize: vertical;
    }
    .hint {
      font-size: 11px;
      color: $text-muted;
      margin-top: 4px;
    }
  }
}

/* 权限树 */
.perm-tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.perm-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.12s;
  &:hover {
    background: $green-light;
  }
  input[type='checkbox'] {
    accent-color: $green-800;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
}
.perm-node-level1 {
  font-weight: 600;
  padding-left: 12px;
}
.perm-node-level2 {
  padding-left: 32px;
  color: $text-secondary;
}
.perm-node-level3 {
  padding-left: 52px;
  color: $text-secondary;
  font-size: 12px;
}

/* 图表区 */
.chart-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

/* 柱状图 */
.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 120px;
  padding-top: 8px;

  .bar {
    flex: 1;
    border-radius: 4px 4px 0 0;
    min-height: 8px;
    background: linear-gradient(to top, $green-500, $green-600);
  }
  .bar-label {
    text-align: center;
    font-size: 10px;
    color: $text-muted;
    margin-top: 6px;
  }
}

/* 饼图图例 */
.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pie-legend-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.pie-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}
.pie-legend-label {
  color: $text-secondary;
  flex: 1;
}
.pie-legend-val {
  font-weight: 600;
  color: $text-primary;
}

/* 表格操作 */
.table-actions {
  display: flex;
  gap: 6px;
}

.table-act {
  padding: 4px 10px;
  border-radius: 4px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.12s;
}

.table-act-edit {
  background: $green-light;
  color: $green-800;
  border: 1px solid rgba(45, 90, 61, 0.12);
  &:hover {
    background: rgba(45, 90, 61, 0.1);
  }
}

.table-act-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.1);
  &:hover {
    background: #fee2e2;
  }
}

/* 卡片标题 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  h3 {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }
  .tag {
    font-size: 11px;
    color: $text-muted;
    background: $border-light;
    padding: 2px 10px;
    border-radius: 4px;
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .chart-section {
    grid-template-columns: 1fr;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
