<template>
  <header class="header">
    <!-- 面包屑导航 -->
    <el-breadcrumb separator="/" class="header-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item v-if="breadcrumbParent">{{ breadcrumbParent }}</el-breadcrumb-item>
      <el-breadcrumb-item>{{ breadcrumbCurrent }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 右侧操作按钮 -->
    <div class="header-right">
      <el-tooltip content="通知" placement="bottom" :show-after="500">
        <div class="header-btn" @click="handleNotify">
          <el-icon :size="16"><Bell /></el-icon>
          <span class="badge" v-if="unreadCount > 0"></span>
        </div>
      </el-tooltip>

      <el-tooltip content="设置" placement="bottom" :show-after="500">
        <div class="header-btn" @click="handleSetting">
          <el-icon :size="16"><Setting /></el-icon>
        </div>
      </el-tooltip>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Bell, Setting } from "@element-plus/icons-vue"
import { useMenuStore } from "@/stores/sider"
import { storeToRefs } from "pinia"
import { ElMessage } from "element-plus"

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()
const { sidebarMenus } = storeToRefs(menuStore)

const unreadCount = ref(0)

/* ====== 面包屑：从菜单树按当前路径查找层级 ====== */
/* ====== 面包屑：从菜单树按当前路径查找层级 ====== */
function findBreadcrumb(path: string): { parent: string; current: string; parentPath: string } {
  for (const group of sidebarMenus.value) {
    for (const child of group.children ?? []) {
      if (child.path === path) {
        return { parent: group.name, current: child.name, parentPath: group.children[0]?.path || "/" }
      }
    }
  }
  return { parent: "", current: "", parentPath: "" }
}

const breadcrumb = computed(() => findBreadcrumb(route.path))
const breadcrumbParent = computed(() => breadcrumb.value.parent)
const breadcrumbParentPath = computed(() => breadcrumb.value.parentPath || "/")
const breadcrumbCurrent = computed(() => breadcrumb.value.current || route.meta.title || route.path)

/* ====== 通知按钮（占位） ====== */
function handleNotify() {
  ElMessage.info("通知功能开发中")
}

/* ====== 设置按钮 → 跳转系统设置 ====== */
function handleSetting() {
  router.push("/system/AI")
}
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

/* ====== 面包屑：覆盖 el-breadcrumb 样式 ====== */
.header-breadcrumb {
  :deep(.el-breadcrumb__inner) {
    font-size: 13px;
    color: $text-secondary;
    font-weight: 400;
    text-decoration: none;

    &:hover {
      color: $green-800;
    }
  }

  :deep(.el-breadcrumb__separator) {
    color: $text-muted;
    font-weight: 400;
    margin: 0 6px;
  }

  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: $text-primary;
    font-weight: 500;
    cursor: default;

    &:hover {
      color: $text-primary;
    }
  }
}

/* ====== 右侧按钮区 ====== */
.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid $border-light;
  background: $card-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: $text-secondary;
  transition: all 0.15s;
  position: relative;

  &:hover {
    border-color: $text-muted;
    color: $text-primary;
  }

  .badge {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background: #dc2626;
    border-radius: 50%;
  }
}
</style>