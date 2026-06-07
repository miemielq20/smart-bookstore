<template>
  <header class="header">
    <!-- 面包屑 -->
    <div class="breadcrumb">
      <a>首页</a>
      <span class="sep">/</span>
      <a>{{ parentTitle }}</a>
      <span class="sep">/</span>
      <span class="current">{{ currentTitle }}</span>
    </div>

    <!-- 右侧操作 -->
    <div class="header-right">
      <div class="header-btn" title="通知">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <span class="badge"></span>
      </div>
      <div class="header-btn" title="设置">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

/* 面包屑映射 — 后续从菜单数据动态生成 */
const breadcrumbMap: Record<string, { parent: string; current: string }> = {
  '/dashboard/overview':  { parent: '数据看板', current: '总览' },
  '/dashboard/traffic':   { parent: '数据看板', current: '访问统计' },
  '/books/list':           { parent: '图书管理', current: '图书列表' },
  '/books/categories':     { parent: '图书管理', current: '分类管理' },
  '/books/banners':        { parent: '图书管理', current: 'Banner管理' },
  '/orders/list':          { parent: '订单管理', current: '订单列表' },
  '/orders/refunds':       { parent: '订单管理', current: '退款管理' },
  '/system/groups':        { parent: '系统管理', current: '权限组' },
  '/system/menus':         { parent: '系统管理', current: '菜单管理' },
  '/system/ai':            { parent: '系统管理', current: 'AI设置' },
}

import { computed } from 'vue'
const crumb = computed(() => breadcrumbMap[route.path] ?? { parent: '', current: '' })
const parentTitle = computed(() => crumb.value.parent)
const currentTitle = computed(() => crumb.value.current)
</script>

<style lang="scss" scoped>
$card-bg: #faf7f1;
$border-light: #efe9dc;
$text-primary: #2c2416;
$text-secondary: #7a6e5e;
$text-muted: #b0a494;
$green-800: #2d5a3d;

.header {
  height: 60px;
  background: $card-bg;
  border-bottom: 1px solid $border-light;
  display: flex;
  align-items: center;
  padding: 0 28px;
  gap: 16px;
  flex-shrink: 0;
}

.breadcrumb {
  display: flex; align-items: center; gap: 6px; font-size: 13px;
  a { color: $text-secondary; text-decoration: none; &:hover { color: $green-800; } }
  .sep { color: $text-muted; }
  .current { color: $text-primary; font-weight: 500; }
}

.header-right {
  margin-left: auto;
  display: flex; align-items: center; gap: 14px;
}

.header-btn {
  width: 34px; height: 34px;
  border-radius: 8px;
  border: 1px solid $border-light;
  background: $card-bg;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: $text-secondary;
  transition: all 0.15s;
  position: relative;

  &:hover { border-color: $text-muted; color: $text-primary; }

  .badge {
    position: absolute; top: -2px; right: -2px;
    width: 8px; height: 8px;
    background: #dc2626;
    border-radius: 50%;
  }
}
</style>
