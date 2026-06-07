<template>
 <aside class="sidebar">
  <!-- Logo -->
  <div class="sidebar-logo">
    <div class="icon">📚</div>
    <span class="name">智慧书城</span>
    <span class="version">v2.0</span>
  </div>

  <!-- 菜单导航 -->
  <nav class="sidebar-nav">
    <template v-for="group in menuGroups" :key="group.id">
      <div class="menu-group">
        <!-- 一级菜单（分组标题） -->
        <div class="menu-group-title" @click="group.collapsed = !group.collapsed">
        <span class="icon" :class="group.meta.icon"></span>
          <span class="label">{{ group.meta.title }}</span>
          <span class="arrow" :class="{ open: !group.collapsed }">▸</span>
        </div>

        <!-- 二级菜单 -->
        <div
          class="menu-items"
          :class="{ collapsed: group.collapsed }"
          :style="{
            maxHeight: group.collapsed ? 0 : (group.children?.length || 0) * 38 + 'px'
          }"
        >
          <router-link
            v-for="item in group.children"
            :key="item.name"
            :to="item.path"
            class="menu-item"
            :class="{ active: currentPath.startsWith(item.path) }"
          >
            <span class="dot"></span>
            <span class="label">{{ item.meta.title }}</span>
          </router-link>
        </div>
      </div>
    </template>
  </nav>

  <!-- 底部用户信息 -->
  <div class="sidebar-footer">
    <div class="sidebar-user">
      <div class="avatar">管</div>
      <div class="info">
        <div class="uname">{{ username }}</div>
        <div class="urole">{{ role }}</div>
      </div>
    </div>
  </div>
</aside>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import {getMenusApi} from '@/api/api'
import {onMounted} from 'vue'
import type{MenusApiResponse} from '@/type/api.response'

const route = useRoute()
const currentPath = computed(() => route.path)

/* 占位数据 — 后续从后端菜单接口获取 */
const username = ref('超级管理员')
const role = ref('admin')

const collapsed=ref(false)

const menuGroups = ref<MenusApiResponse['data']>([])
const filterMenus = function (menus: any[]) {
  const formatMenu = (menuList: any[]): any[] => {
    return menuList
      .filter(item => item.visible === 1)
      .sort((a, b) => a.sort - b.sort)
      .map(item => {
        const { id, name, path, icon, permissionCode, children } = item

        const formatted: any = {
          id,
          path: path || '',
          name: permissionCode,
          meta: {
            title: name,
            icon: icon || '',
          },
          collapsed: false, 
          children: children && children.length ? formatMenu(children) : [],
        }

        if (path) {
          formatted.component = () => import(`@/views${path}/index.vue`)
        }

        return formatted
      })
  }

  const allFormatted = formatMenu(menus)

  // ✅ 只取目录作为一级菜单
  return allFormatted.filter(
    (item: any) => !item.path && item.children?.length > 0
  )
}
onMounted(async () => {
  const menus = await getMenusApi()
  const newMenus = filterMenus(menus.data)
  menuGroups.value= newMenus
  console.log(newMenus)

})
</script>

<style lang="scss" scoped>
/* 颜色变量（与设计稿一致） */
$green-900: #1a3a28;
$green-800: #2d5a3d;
$green-700: #3a6b4a;
$green-600: #4a7d5a;

.sidebar {
  width: 240px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow: hidden;
  background-image:
    repeating-linear-gradient(87deg, transparent, transparent 3px, rgba(0, 0, 0, 0.02) 3px, rgba(0, 0, 0, 0.02) 4px),
    repeating-linear-gradient(93deg, transparent, transparent 15px, rgba(0, 0, 0, 0.015) 15px, rgba(0, 0, 0, 0.015) 16px),
    linear-gradient(180deg, $green-800, $green-700 60%, $green-600);

  /* 径向光晕 */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.04) 0%, transparent 60%);
    pointer-events: none;
  }
}

.sidebar-logo {
  padding: 22px 20px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  z-index: 1;

  .icon {
    width: 34px; height: 34px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .name {
    font-size: 16px; font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 1px;
  }
  .version {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.3);
    margin-left: auto;
    letter-spacing: 1px;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  overflow-y: auto;
  position: relative;
  z-index: 1;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 2px; }
}

.menu-group { margin-bottom: 4px; }

.menu-group-title {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  font-size: 12px; font-weight: 500;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 1px;
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
  text-transform: uppercase;

  &:hover { color: rgba(255, 255, 255, 0.5); }

  .arrow {
    margin-left: auto;
    transition: transform 0.2s;
    opacity: 0.5;
    font-size: 10px;
    &.open { transform: rotate(90deg); }
  }
}

.menu-items {
  overflow: hidden;
  transition: max-height 0.25s ease;
  &.collapsed { max-height: 0 !important; }
}

.menu-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px 9px 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.15s;
  cursor: pointer;
  margin-bottom: 1px;
  position: relative;

  &:hover { color: rgba(255, 255, 255, 0.85); background: rgba(255, 255, 255, 0.04); }

  &.active {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    font-weight: 500;

    &::before {
      content: "";
      position: absolute; left: 0; top: 6px; bottom: 6px;
      width: 3px;
      background: #fbbf24;
      border-radius: 2px;
    }
  }

  .dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.5;
    flex-shrink: 0;
  }

  &.active .dot { opacity: 1; background: #fbbf24; }
}

.sidebar-footer {
  padding: 14px 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  z-index: 1;
}

.sidebar-user {
  display: flex; align-items: center; gap: 10px;

  .avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  .info {
    flex: 1; min-width: 0;
    .uname { font-size: 13px; font-weight: 500; color: rgba(255, 255, 255, 0.8); }
    .urole { font-size: 11px; color: rgba(255, 255, 255, 0.35); }
  }
}
</style>
