<template>
  <aside class="sidebar">
    <!-- Logo 区域 -->
    <div class="sidebar-logo">
      <div class="logo-icon">
        <el-icon :size="20"><Reading /></el-icon>
      </div>
      <span class="logo-name">智慧书城</span>
      <span class="logo-version">v2.0</span>
    </div>

    <!-- el-menu 导航 -->
    <el-menu
      :default-active="activeIndex"
      :router="true"
      :collapse="false"
      class="sidebar-menu" :default-openeds="openedGroups" @open="onMenuOpen" @close="onMenuClose"
      background-color="transparent"
      text-color="rgba(255,255,255,0.6)"
      active-text-color="#ffffff"
    >
      <el-sub-menu
        v-for="group in sidebarMenus"
        :key="group.id"
        :index="String(group.id)"
        popper-class="sidebar-popper"
      >
        <template #title>
          <el-icon class="menu-group-icon">
            <component :is="iconComponent(group.icon)" />
          </el-icon>
          <span class="menu-group-label">{{ group.name }}</span>
        </template>

        <el-menu-item
          v-for="item in group.children"
          :key="item.permissionCode"
          :index="item.path"
        >
          <span class="menu-item-dot"></span>
          <span>{{ item.name }}</span>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>

    <!-- 底部用户信息 -->
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="user-avatar">
          <el-icon :size="16"><UserFilled /></el-icon>
        </div>
        <div class="user-info">
          <div class="user-name">{{ username }}</div>
          <div class="user-role">{{ role }}</div>
        </div>
        <div class="logout-btn" title="退出登录" @click="handleLogout">
          <el-icon :size="18" color="white"><SwitchButton /></el-icon>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useMenuStore } from "@/stores/sider"
import { useRouterStore } from "@/stores/route"
import { storeToRefs } from "pinia"
import {
  DataAnalysis,
  Reading,
  ShoppingCart,
  Setting,
  UserFilled, SwitchButton,} from "@element-plus/icons-vue"
import { ElMessageBox } from "element-plus"

const route = useRoute()

/* activeIndex 始终以当前路径匹配，el-menu 的 router 模式自动高亮 */
const activeIndex = computed(() => route.path === '/' ? '/dashboard/Overview' : route.path)

const username = ref("超级管理员")
const role = ref("admin")

const router = useRouter()
const menuStore = useMenuStore()
const routeStore = useRouterStore()

/* 退出登录 */

function handleLogout() {
  ElMessageBox.confirm(
    "确定要退出登录吗？",
    "退出确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      roundButton: true,
    }
  ).then(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("MENU_CACHE")
    menuStore.clearMenus()
    routeStore.routerReady = false
    router.replace("/login")
  }).catch(() => {})
}
const { sidebarMenus } = storeToRefs(menuStore)

/* API 图标名 → Element Plus 图标组件 */
const iconMap: Record<string, any> = {
  DashboardOutlined: DataAnalysis,
  BookOutlined: Reading,
  ShoppingCartOutlined: ShoppingCart,
  SettingOutlined: Setting,
}

/* 从 store 取持久化的展开状态，首次进入时初始化 */
const openedGroups = ref<string[]>([])
const initOpened = () => {
  menuStore.loadOpenedGroups()
  if (menuStore.openedGroups.length > 0) {
    openedGroups.value = [...menuStore.openedGroups]
  } else {
    const ids: string[] = []
    if (sidebarMenus.value.length > 0 && sidebarMenus.value[0]) {
      ids.push(String(sidebarMenus.value[0].id))
    }
    for (const group of sidebarMenus.value) {
      if (group.children?.some((c: any) => route.path.startsWith(c.path))) {
        ids.push(String(group.id))
      }
    }
    openedGroups.value = ids
    menuStore.setOpenedGroups(ids)
  }
}

watch(sidebarMenus, () => { if (openedGroups.value.length === 0) initOpened() }, { immediate: true })

/* 侧边栏展开/折叠事件 -> 同步到 store */
function onMenuOpen(key: string) {
  if (!openedGroups.value.includes(key)) {
    openedGroups.value.push(key)
    menuStore.setOpenedGroups([...openedGroups.value])
  }
}

function onMenuClose(key: string) {
  openedGroups.value = openedGroups.value.filter((k: string) => k !== key)
  menuStore.setOpenedGroups([...openedGroups.value])
}

function iconComponent(name: string | null) {
  return iconMap[name ?? ""] ?? Setting
}
</script>

<style lang="scss" scoped>
/* ==================== 色彩变量 ==================== */
$green-900: #1a3a28;
$green-800: #2d5a3d;
$green-700: #3a6b4a;
$green-600: #4a7d5a;

/* ==================== 侧边栏容器 ==================== */
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

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.04) 0%, transparent 60%);
    pointer-events: none;
  }
}

/* ==================== Logo ==================== */
.sidebar-logo {
  padding: 22px 20px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  z-index: 1;

  .logo-icon {
    width: 34px;
    height: 34px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
  }

  .logo-name {
    font-size: 16px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 1px;
  }

  .logo-version {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.3);
    margin-left: auto;
    letter-spacing: 1px;
  }
}

/* ==================== el-menu 全局覆盖 ==================== */
.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  border-right: none !important;
  padding: 8px 10px;
  position: relative;
  z-index: 1;

  /* 滚动条 */
  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  /* 消除 el-menu 默认底边框 */
  :deep(.el-menu) {
    border-right: none;
  }

  /* ===== SubMenu 标题 ===== */
  :deep(.el-sub-menu__title) {
    height: 40px;
    line-height: 40px;
    padding-left: 12px !important;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.35) !important;
    text-transform: uppercase;
    border-radius: 8px;
    margin-bottom: 2px;
    transition: color 0.15s, background 0.15s;

    &:hover {
      color: rgba(255, 255, 255, 0.5) !important;
      background: rgba(255, 255, 255, 0.03) !important;
    }
  }

  /* SubMenu 展开箭头 */
  :deep(.el-sub-menu__icon-arrow) {
    color: rgba(255, 255, 255, 0.35);
    font-size: 11px;
    right: 12px;
    margin-top: -5px;
  }

  /* ===== SubMenu 展开时标题高亮 ===== */
  :deep(.el-sub-menu.is-opened .el-sub-menu__title) {
    color: rgba(255, 255, 255, 0.5) !important;
  }

  /* ===== MenuItem 子菜单项 ===== */
  :deep(.el-menu-item) {
    height: 38px;
    line-height: 38px;
    padding-left: 28px !important;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6) !important;
    border-radius: 8px;
    margin-bottom: 1px;
    transition: all 0.15s;

    &:hover {
      color: rgba(255, 255, 255, 0.85) !important;
      background: rgba(255, 255, 255, 0.04) !important;
    }

    /* 激活态 */
    &.is-active {
      color: #fff !important;
      background: rgba(255, 255, 255, 0.1) !important;
      font-weight: 500;

      &::before {
        content: "";
        position: absolute;
        left: 8px;
        top: 8px;
        bottom: 8px;
        width: 3px;
        background: #fbbf24;
        border-radius: 2px;
      }

      .menu-item-dot {
        opacity: 1;
        background: #fbbf24;
      }
    }
  }

  /* ===== 子菜单点状装饰 ===== */
  .menu-item-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.5;
    flex-shrink: 0;
    margin-right: 8px;
    display: inline-block;
    vertical-align: middle;
    margin-top: -1px;
  }

  /* ===== 一级菜单图标 ===== */
  .menu-group-icon {
    margin-right: 8px;
    font-size: 16px;
    width: 20px;
    text-align: center;
    color: inherit;
  }

  .menu-group-label {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
}

/* ==================== 底部用户信息 ==================== */
.sidebar-footer {
  padding: 14px 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  z-index: 1;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
  }

  .user-info {
    flex: 1;
    min-width: 0;

    .user-name {
      font-size: 13px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
    }

    .logout-btn { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.3); cursor: pointer; transition: all 0.15s; flex-shrink: 0; &:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.08); } }

  .user-role {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.35);
    }
  }
}
</style>