<template>
  <view class="page" :style="pageStyle">
    <!-- #ifdef MP-WEIXIN -->
    <view class="mp-status-bar" :style="mpStatusBarStyle"></view>
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <u-navbar
      title=""
      :bg-color="theme.page"
      :border="false"
      :placeholder="true"
      :safe-area-inset-top="true"
    />
    <!-- #endif -->
    <view class="fixed-head search-fixed-head" :style="fixedHeadStyle">
      <view class="nav-bar">
        <view class="back-action" hover-class="tap-soft" @tap="goBack">
          <text class="back-chevron"></text>
        </view>
        <text class="nav-title">搜索图书</text>
        <view class="nav-space"></view>
      </view>

      <u-search
        v-model="keyword"
        placeholder="书名 / 作者 / ISBN"
        bg-color="#FFFDF7"
        border-color="rgba(96,108,56,.16)"
        height="46"
        action-text="搜索"
        @search="handleSearch"
        @custom="handleSearch"
      />

      <scroll-view class="chips" scroll-x show-scrollbar="false">
        <view class="chip-row">
          <u-tag
            v-for="category in displayCategories"
            :key="category.id"
            :text="category.name"
            :plain="!isCategoryActive(category)"
            :bg-color="isCategoryActive(category) ? '#606C38' : '#FFFDF7'"
            :border-color="isCategoryActive(category) ? '#606C38' : 'rgba(96,108,56,.14)'"
            :color="isCategoryActive(category) ? '#FFFDF7' : '#606C38'"
            shape="circle"
            @click="selectCategory(category)"
          />
        </view>
      </scroll-view>

      <u-tabs
        :list="sortTabs"
        :current="currentSort"
        line-color="#606C38"
        :active-style="{ color: '#606C38', fontWeight: '800' }"
        :inactive-style="{ color: '#7A6E5E' }"
        @click="handleSortClick"
      />
    </view>

    <view class="result-head">
      <text class="title">搜索结果</text>
      <text class="sub">共 {{ total }} 本图书</text>
    </view>

    <view class="book-list">
      <u-cell
        v-for="book in displayBooks"
        :key="book.id"
        :title="book.title"
        :label="`${book.author || '未知作者'} · ${book.reading || '适合日常阅读'}`"
        :border="false"
        clickable
        @click="goBookDetail(book.id)"
      >
        <template #icon>
          <view class="mini-cover" :class="getCoverClass(book.id)">
            <image
              v-if="getCoverSrc(book.coverUrl)"
              class="cover-image"
              :src="getCoverSrc(book.coverUrl)"
              mode="aspectFill"
            />
          </view>
        </template>
        <template #value>
          <text class="price">¥{{ formatPrice(book.price) }}</text>
        </template>
      </u-cell>
    </view>

    <view v-if="!displayBooks.length" class="empty-state">
      <u-icon name="search" color="#8B9D83" size="42" />
      <text class="empty-text">未找到书籍</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
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
  { id: 0, name: '全部' },
  { id: 1, name: '文学' },
  { id: 2, name: '科技' },
  { id: 3, name: '经营' },
]

const fallbackBooks: BookItem[] = [
  createBook(1, '人类群星闪耀时', '斯蒂芬·茨威格', 39.8, 64, 9.1, '短篇历史叙事，适合碎片阅读'),
  createBook(2, '置身事内', '兰小欢', 56, 38, 9.2, '理解中国经济运行'),
  createBook(3, '万历十五年', '黄仁宇', 42, 28, 8.9, '制度与人物视角的历史读物'),
]

function createBook(
  id: number,
  title: string,
  author: string,
  price: number,
  stock: number,
  rating: number,
  reading: string,
): BookItem {
  return {
    id,
    title,
    author,
    isbn: null,
    coverUrl: null,
    price,
    originalPrice: null,
    description: reading,
    language: '中文',
    stock,
    salesCount: 0,
    viewCount: 0,
    rating,
    status: 1,
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
    reading,
  }
}

const keyword = ref('')
const activeCategory = ref('')
const categories = ref<CategoryOption[]>([])
const books = ref<BookItem[]>([])
const total = ref(0)
const currentSort = ref(0)
const theme = { page: '#F8F4EA' }
const statusBarHeight = ref(0)

const displayCategories = computed(() => [
  { id: 0, name: '全部' },
  ...(categories.value.length ? categories.value : fallbackCategories.slice(1)),
])
const displayBooks = computed(() => books.value)
const mpStatusBarStyle = computed(() => ({ height: `${statusBarHeight.value}px` }))
const fixedHeadStyle = computed(() =>
  statusBarHeight.value ? { top: `${statusBarHeight.value}px` } : {},
)
const pageStyle = computed(() =>
  statusBarHeight.value ? { paddingTop: `calc(${statusBarHeight.value}px + 318rpx)` } : {},
)

onLoad((options = {}) => {
  initStatusBar()
  const query = options as Record<string, string | undefined>
  keyword.value = query.keyword ?? ''
  activeCategory.value = query.category ?? ''
  loadCategories()
  loadBooks()
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
  statusBarHeight.value = Math.round(
    windowInfo?.statusBarHeight || systemInfo.statusBarHeight || statusFromMenu || 20,
  )
  // #endif
}

async function loadCategories() {
  try {
    const res = await getCategoryOptionsApi()
    categories.value = res.data
  } catch {
    categories.value = []
  }
}

async function loadBooks() {
  try {
    const activeSort = sortTabs[currentSort.value]
    const res = await getBooksApi({
      page: 1,
      pageSize: 30,
      status: 1,
      keyword: keyword.value,
      category: activeCategory.value,
      sort: activeSort.sort,
      order: activeSort.order,
    })
    books.value = res.data.list
    total.value = res.data.total
  } catch {
    books.value = fallbackBooks
    total.value = fallbackBooks.length
  }
}

function handleSearch() {
  loadBooks()
}

function selectCategory(category: CategoryOption) {
  activeCategory.value = category.id === 0 ? '' : category.name
  loadBooks()
}

function isCategoryActive(category: CategoryOption) {
  return category.id === 0 ? !activeCategory.value : activeCategory.value === category.name
}

function handleSortClick(item: { index: number }) {
  currentSort.value = item.index
  loadBooks()
}

function goBookDetail(id: number) {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
    return
  }
  uni.redirectTo({ url: '/pages/index/index' })
}

function getCoverClass(id: number) {
  return `cover-${id % 4}`
}

function getCoverSrc(url: string | null) {
  return normalizeAssetUrl(url)
}

function formatPrice(value: number | string | null) {
  return Number(value ?? 0).toFixed(2)
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: calc(318rpx + env(safe-area-inset-top)) 28rpx 40rpx;
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
  padding: 0 28rpx 12rpx;
  background: #f8f4ea;
}

/* #ifdef MP-WEIXIN */
.fixed-head {
  top: 0;
}
/* #endif */

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 96rpx;
  padding-top: 10rpx;
}

.back-action,
.nav-space {
  width: 76rpx;
  height: 76rpx;
  flex: 0 0 76rpx;
}

.back-action {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.tap-soft {
  opacity: 0.78;
}

.back-chevron {
  width: 18rpx;
  height: 18rpx;
  border-left: 5rpx solid #606c38;
  border-bottom: 5rpx solid #606c38;
  transform: rotate(45deg);
}

.nav-title {
  color: #2c2416;
  font-size: 32rpx;
  font-weight: 900;
}

.chips {
  margin: 24rpx 0 10rpx;
  white-space: nowrap;
}

.chip-row {
  display: flex;
  gap: 16rpx;
}

.result-head {
  margin: 28rpx 0 18rpx;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: 900;
}

.sub {
  display: block;
  margin-top: 6rpx;
  color: #7a6e5e;
  font-size: 23rpx;
}

.book-list {
  overflow: hidden;
  border-radius: 28rpx;
  background: #fffdf7;
}

.mini-cover {
  width: 116rpx;
  height: 156rpx;
  margin-right: 18rpx;
  overflow: hidden;
  border-radius: 20rpx;
  background: #8b9d83;
  box-shadow: inset -14rpx 0 rgba(44, 36, 22, 0.1);
}

.cover-image {
  display: block;
  width: 100%;
  height: 100%;
}

.cover-1 {
  background: #8b9d83;
}
.cover-2 {
  background: #c66b3d;
}
.cover-3 {
  background: #c08e3a;
}
.cover-0 {
  background: #b08b6e;
}

.price {
  color: #c66b3d;
  font-size: 29rpx;
  font-weight: 900;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360rpx;
  margin-top: 28rpx;
  border-radius: 28rpx;
  background: #fffdf7;
}

.empty-text {
  margin-top: 18rpx;
  color: #7a6e5e;
  font-size: 28rpx;
  font-weight: 700;
}
</style>
