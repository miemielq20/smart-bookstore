<template>
  <view class="page" :style="pageStyle">
    <!-- #ifdef MP-WEIXIN -->
    <view class="mp-status-bar" :style="mpStatusBarStyle"></view>
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <u-navbar title="" :bg-color="theme.page" :border="false" :placeholder="true" :safe-area-inset-top="true" />
	<!-- #endif -->
    <view class="fixed-head category-fixed-head" :style="fixedHeadStyle">
      <view class="header">
        <view>
          <text class="title">分类</text>
          <text class="sub">按后台排序与启用状态展示</text>
        </view>
        <view class="round-action search-action" hover-class="tap-soft" @tap="goSearch">
          <u-icon name="search" color="#FFFDF7" size="26" bold />
        </view>
      </view>
    </view>

    <view class="content">
      <scroll-view class="side" scroll-y show-scrollbar="false">
        <u-button
          v-for="category in displayCategories"
          :key="category.id"
          class="side-btn"
          :text="category.name"
          :plain="activeCategory !== category.name"
          :color="activeCategory === category.name ? '#606C38' : '#FFFDF7'"
          :custom-style="getSideButtonStyle(category.name)"
          @click="selectCategory(category.name)"
        />
      </scroll-view>

      <scroll-view class="main" scroll-y show-scrollbar="false">
        <view class="channel-card">
          <text class="channel-title">{{ activeCategory }}</text>
          <text class="channel-sub">当前分类共 {{ total }} 本图书</text>
          <view class="channel-books">
            <text class="spine spine-a"></text>
            <text class="spine spine-b"></text>
            <text class="spine spine-c"></text>
          </view>
        </view>

        <u-tabs
          :list="sortTabs"
          :current="currentSort"
          line-color="#606C38"
          :active-style="{ color: '#606C38', fontWeight: '800' }"
          :inactive-style="{ color: '#7A6E5E' }"
          @click="handleSortClick"
        />

        <view class="book-list">
          <u-cell
            v-for="book in displayBooks"
            :key="book.id"
            :title="book.title"
            :label="`${book.author || '未知作者'} · 库存 ${book.stock}`"
            :border="false"
            clickable
            @click="goBookDetail(book.id)"
          >
            <template #icon>
              <view class="mini-cover" :class="getCoverClass(book.id)" :style="getCoverStyle(book.coverUrl)"></view>
            </template>
            <template #value>
              <view class="cell-value">
                <text class="price">¥{{ formatPrice(book.price) }}</text>
                <text class="rating">评分 {{ book.rating || '-' }}</text>
              </view>
            </template>
          </u-cell>
        </view>

        <u-empty v-if="!displayBooks.length" text="暂无图书" mode="list" />
      </scroll-view>
    </view>
    <AppTabBar current="category" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppTabBar from '../../components/AppTabBar/AppTabBar.vue'
import { normalizeAssetUrl } from '../../services/assets'
import { getBooksApi, getCategoryOptionsApi } from '../../services/bookstore'
import type { BookItem, CategoryOption } from '../../types'

const sortTabs = [
  { name: '综合', sort: 'createdAt', order: 'desc' },
  { name: '销量', sort: 'salesCount', order: 'desc' },
  { name: '价格', sort: 'price', order: 'asc' },
  { name: '评分', sort: 'rating', order: 'desc' },
] as const

const fallbackCategories: CategoryOption[] = [
  { id: 1, name: '文学' },
  { id: 2, name: '科技' },
  { id: 3, name: '经营' },
  { id: 4, name: '历史' },
  { id: 5, name: '心理' },
  { id: 6, name: '少儿' },
  { id: 7, name: '教材' },
]

const fallbackBooks: BookItem[] = [
  createBook(1, '人类群星闪耀时', '斯蒂芬·茨威格', 39.8, 64, 9.1, '短篇历史叙事，适合碎片阅读'),
  createBook(2, '活着', '余华', 35, 42, 9.4, '经典文学入门'),
  createBook(3, '额尔古纳河右岸', '迟子建', 48, 19, 8.8, '适合文学分类频道展示'),
  createBook(4, '平凡的世界', '路遥', 108, 12, 9.3, '长篇阅读与套装图书'),
]

function createBook(id: number, title: string, author: string, price: number, stock: number, rating: number, reading: string): BookItem {
  return { id, title, author, isbn: null, coverUrl: null, price, originalPrice: null, description: reading, language: '中文', stock, salesCount: 0, viewCount: 0, rating, status: 1, createdAt: '', updatedAt: '', deletedAt: null, reading }
}

const theme = { page: '#F8F4EA' }
const statusBarHeight = ref(0)
const activeCategory = ref('文学')
const categories = ref<CategoryOption[]>([])
const books = ref<BookItem[]>([])
const total = ref(0)
const currentSort = ref(0)

const displayCategories = computed(() => (categories.value.length ? categories.value : fallbackCategories))
const displayBooks = computed(() => (books.value.length ? books.value : fallbackBooks))
const mpStatusBarStyle = computed(() => ({ height: `${statusBarHeight.value}px` }))
const fixedHeadStyle = computed(() => (statusBarHeight.value ? { top: `${statusBarHeight.value}px` } : {}))
const pageStyle = computed(() => (statusBarHeight.value ? { paddingTop: `calc(${statusBarHeight.value}px + 170rpx)` } : {}))

onLoad(() => {
  initStatusBar()
  loadCategories()
  loadBooks(activeCategory.value)
})

function initStatusBar() {
  // #ifdef MP-WEIXIN
  const wxUni = uni as UniApp.Uni & {
    getWindowInfo?: () => { statusBarHeight?: number }
    getMenuButtonBoundingClientRect?: () => { top?: number }
  }
  const windowInfo = wxUni.getWindowInfo?.()
  const systemInfo = uni.getSystemInfoSync()
  const menuButton = wxUni.getMenuButtonBoundingClientRect?.()
  const statusFromMenu = menuButton?.top ? Math.max(menuButton.top - 4, 0) : 0
  statusBarHeight.value = Math.round(windowInfo?.statusBarHeight || systemInfo.statusBarHeight || statusFromMenu || 20)
  // #endif
}

async function loadCategories() {
  try {
    const res = await getCategoryOptionsApi()
    categories.value = res.data
    if (res.data[0]?.name) {
      activeCategory.value = res.data[0].name
      loadBooks(res.data[0].name)
    }
  } catch {
    categories.value = []
    total.value = fallbackBooks.length
  }
}

async function loadBooks(category: string) {
  try {
    const activeSort = sortTabs[currentSort.value]
    const res = await getBooksApi({
      page: 1,
      pageSize: 20,
      status: 1,
      category,
      sort: activeSort.sort,
      order: activeSort.order,
    })
    books.value = res.data.list
    total.value = res.data.total
  } catch {
    books.value = []
    total.value = fallbackBooks.length
  }
}

function selectCategory(name: string) {
  activeCategory.value = name
  loadBooks(name)
}

function handleSortClick(item: { index: number }) {
  currentSort.value = item.index
  loadBooks(activeCategory.value)
}

function goBookDetail(id: number) {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/search' })
}

function getSideButtonStyle(name: string) {
  const active = activeCategory.value === name
  return {
    color: active ? '#FFFDF7' : '#7A6E5E',
    background: active ? '#606C38' : '#FFFDF7',
    border: '0',
    marginBottom: '14rpx',
    height: '78rpx',
    borderRadius: '24rpx',
    fontWeight: '800',
  }
}

function getCoverClass(id: number) {
  return `cover-${id % 4}`
}

function getCoverStyle(url: string | null) {
  const src = normalizeAssetUrl(url)
  if (!src) return {}
  return {
    backgroundImage: `url(${src})`,
  }
}

function formatPrice(value: number | string | null) {
  return Number(value ?? 0).toFixed(2)
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: calc(170rpx + env(safe-area-inset-top)) 24rpx calc(132rpx + env(safe-area-inset-bottom));
  background: #f8f4ea;
  color: #2c2416;
}

.mp-status-bar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 60;
  background: #f8f4ea;
}

.fixed-head {
  position: fixed;
  top: calc(44px + env(safe-area-inset-top));
  right: 0;
  left: 0;
  z-index: 50;
  padding: 0 24rpx 20rpx;
  background: #f8f4ea;
}

/* #ifdef MP-WEIXIN */
.fixed-head {
  top: 0;
}
/* #endif */

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.title {
  display: block;
  font-size: 50rpx;
  font-weight: 900;
  line-height: 1.1;
}

.sub {
  display: block;
  margin-top: 8rpx;
  color: #7a6e5e;
  font-size: 24rpx;
}

.round-action {
  position: relative;
  width: 84rpx;
  height: 84rpx;
  flex: 0 0 84rpx;
  border-radius: 50%;
  background: #606c38;
  box-shadow: 0 10rpx 22rpx rgba(96, 108, 56, 0.18);
}

.search-action {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tap-soft {
  opacity: 0.78;
}

.content {
  display: flex;
  gap: 20rpx;
  height: calc(100vh - 322rpx - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  min-height: 980rpx;
}

.side {
  width: 164rpx;
  height: 100%;
  flex-shrink: 0;
}

.side-btn {
  width: 100%;
}

.main {
  height: 100%;
  flex: 1;
  min-width: 0;
}

.channel-card {
  position: relative;
  min-height: 220rpx;
  margin-bottom: 16rpx;
  overflow: hidden;
  border-radius: 34rpx;
  background: linear-gradient(118deg, #24433b, #606c38);
  padding: 30rpx;
}

.channel-title {
  display: block;
  color: #fffdf7;
  font-size: 42rpx;
  font-weight: 900;
}

.channel-sub {
  display: block;
  margin-top: 12rpx;
  color: rgba(255, 253, 247, 0.76);
  font-size: 23rpx;
}

.channel-books {
  position: absolute;
  right: 24rpx;
  bottom: 22rpx;
  display: flex;
  align-items: flex-end;
  gap: 10rpx;
}

.spine {
  display: block;
  width: 36rpx;
  border-radius: 10rpx;
}

.spine-a { height: 98rpx; background: #b08b6e; }
.spine-b { height: 136rpx; background: #c66b3d; }
.spine-c { height: 78rpx; background: #c08e3a; }

.book-list {
  overflow: hidden;
  margin-top: 16rpx;
  border-radius: 28rpx;
  background: #fffdf7;
}

.mini-cover {
  width: 112rpx;
  height: 154rpx;
  margin-right: 18rpx;
  overflow: hidden;
  border-radius: 20rpx;
  background: #8b9d83;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  box-shadow: inset -14rpx 0 rgba(44, 36, 22, 0.1);
}

.cover-1 { background-color: #8b9d83; }
.cover-2 { background-color: #c66b3d; }
.cover-3 { background-color: #c08e3a; }
.cover-0 { background-color: #b08b6e; }

.cell-value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price {
  color: #c66b3d;
  font-size: 29rpx;
  font-weight: 900;
}

.rating {
  margin-top: 8rpx;
  color: #7a6e5e;
  font-size: 21rpx;
}
</style>
