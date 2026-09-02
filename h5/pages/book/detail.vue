<template>
  <view class="page" :style="pageStyle">
    <!-- #ifdef MP-WEIXIN -->
    <view class="mp-status-bar" :style="mpStatusBarStyle"></view>
    <!-- #endif -->
   <!-- #ifndef MP-WEIXIN -->
   <u-navbar title="" :bg-color="theme.page" :border="false" :placeholder="true" :safe-area-inset-top="true" />
   <!-- #endif -->
    <view class="nav-bar" :style="navBarStyle">
      <view class="back-action" hover-class="tap-soft" @tap="goBack">
        <text class="back-chevron"></text>
      </view>
      <text class="nav-title">图书详情</text>
      <view class="nav-space"></view>
    </view>

    <view class="cover-wrap">
      <view class="detail-cover" :class="getCoverClass(book.id)">
        <image v-if="coverSrc" class="detail-cover-image" :src="coverSrc" mode="aspectFill" />
        <view v-else class="cover-lines"><text></text><text></text><text></text></view>
      </view>
    </view>

    <view class="detail-card">
      <text class="book-title">{{ book.title }}</text>
      <text class="book-author">{{ book.author || '未知作者' }} · {{ book.language || '中文' }}</text>

      <view class="meta-row">
        <view class="meta-box"><text class="meta-value">{{ book.rating || '-' }}</text><text class="meta-label">评分</text></view>
        <view class="meta-box"><text class="meta-value">{{ book.salesCount }}</text><text class="meta-label">销量</text></view>
        <view class="meta-box"><text class="meta-value">{{ book.stock }}</text><text class="meta-label">库存</text></view>
      </view>

      <u-line color="rgba(96,108,56,.14)" />

      <view class="price-row">
        <text class="price">¥{{ formatPrice(book.price) }}</text>
        <text v-if="book.originalPrice" class="origin">¥{{ formatPrice(book.originalPrice) }}</text>
      </view>

      <view class="tags">
        <u-tag v-for="tag in book.tags || []" :key="tag" :text="tag" plain color="#606C38" border-color="rgba(96,108,56,.2)" shape="circle" />
        <u-tag v-for="category in book.categories || []" :key="category" :text="category" bg-color="#E8DCC7" border-color="#E8DCC7" color="#606C38" shape="circle" />
      </view>


      <view class="section">
        <text class="paragraph">{{ book.description || '后台图书管理可维护简介、封面、价格、库存、分类与标签。' }}</text>
      </view>
    </view>

    <view class="bottom-bar">
      <u-button class="fav-btn" plain color="#606C38" icon="heart" :text="favorited ? '取消收藏' : '收藏'" @click="toggleFavorite" />
      <u-button class="cart-btn" color="#606C38" icon="shopping-cart" text="加入购物车" :loading="adding" :disabled="book.status !== 1 || book.stock < 1" @click="addToCart" />
    </view>
  </view>
</template>

<script lang="ts" setup>
// @ts-ignore - uni-app global objects
import { computed, onMounted, ref } from 'vue'
import { addCartItemApi, addFavoriteApi, getBookDetailApi, getFavoritesApi, removeFavoriteApi } from '../../services/bookstore'
import { normalizeAssetUrl } from '../../services/assets'
import type { BookItem } from '../../types'

// @ts-ignore - uni-app global objects
const theme = { page: '#F8F4EA' }
const book = ref<BookItem>(createBook(1, '人类群星闪耀时', '斯蒂芬·茨威格', 39.8, 64, 9.1, '短篇历史叙事，适合碎片阅读'))
const coverSrc = ref('')
const adding = ref(false)
const favorited = ref(false)
const statusBarHeight = ref(0)
const mpStatusBarStyle = computed(() => ({ height: `${statusBarHeight.value}px` }))
const navBarStyle = computed(() => (statusBarHeight.value ? { top: `${statusBarHeight.value}px` } : {}))
const pageStyle = computed(() => (statusBarHeight.value ? { paddingTop: `calc(${statusBarHeight.value}px + 116rpx)` } : {}))

onMounted(() => {
  initStatusBar()
  // @ts-ignore - uni-app global function
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as { options?: Record<string, string> }
  const id = Number(current.options?.id ?? 1)
  loadBook(id)
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

async function loadBook(id: number) {
  try {
    const res = await getBookDetailApi(id)
    book.value = res.data
    coverSrc.value = normalizeAssetUrl(res.data.coverUrl)
    // 详情页打开时读取收藏记录，保证按钮状态与数据库一致。
    if (uni.getStorageSync('token')) {
      const favorites = await getFavoritesApi()
      favorited.value = favorites.data.some((item) => item.book.id === res.data.id)
    }
  } catch {
    book.value = createBook(id, '人类群星闪耀时', '斯蒂芬·茨威格', 39.8, 64, 9.1, '短篇历史叙事，适合碎片阅读')
    coverSrc.value = ''
  }
}

function goBack() {
  // @ts-ignore - uni-app global object
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
    return
  }
  uni.redirectTo({ url: '/pages/index/index' })
}

async function toggleFavorite() {
  if (!uni.getStorageSync('token')) {
    uni.navigateTo({ url: `/pages/login/login?redirect=${encodeURIComponent(`/pages/book/detail?id=${book.value.id}`)}` })
    return
  }
  // 收藏按钮直接调用后端接口，避免只在前端显示假状态。
  if (favorited.value) await removeFavoriteApi(book.value.id)
  else await addFavoriteApi(book.value.id)
  favorited.value = !favorited.value
  uni.showToast({ title: favorited.value ? '已加入收藏' : '已取消收藏', icon: 'success' })
}

async function addToCart() {
  if (adding.value || book.value.status !== 1 || book.value.stock < 1) return
  adding.value = true
  try {
    await addCartItemApi({ bookId: book.value.id })
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  } finally {
    adding.value = false
  }
}

function getCoverClass(id: number) {
  return `cover-${id % 4}`
}

function formatPrice(value: number | string | null) {
  return Number(value ?? 0).toFixed(2)
}

function createBook(id: number, title: string, author: string, price: number, stock: number, rating: number, reading: string): BookItem {
  return { id, title, author, isbn: null, coverUrl: null, price, originalPrice: null, description: '从真实业务表读取图书基础信息、分类、标签、价格、库存和阅读建议。', language: '中文', stock, salesCount: 1280, viewCount: 0, rating, status: 1, createdAt: '', updatedAt: '', deletedAt: null, reading, categories: ['文学'], tags: ['经典'] }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: calc(212rpx + env(safe-area-inset-top)) 28rpx calc(150rpx + env(safe-area-inset-bottom));
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

.nav-bar {
  position: fixed;
  top: calc(44px + env(safe-area-inset-top));
  right: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(96rpx + env(safe-area-inset-top));
  padding: calc(10rpx + env(safe-area-inset-top)) 28rpx 0;
  background: #f8f4ea;
}

/* #ifdef MP-WEIXIN */
.nav-bar {
  top: 0;
  height: 116rpx;
  padding-top: 10rpx;
}
/* #endif */

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

.cover-wrap {
  display: flex;
  justify-content: center;
  padding: 20rpx 0 28rpx;
}

.detail-cover {
  width: 360rpx;
  height: 500rpx;
  overflow: hidden;
  border-radius: 36rpx;
  background: #c66b3d;
  box-shadow: inset -28rpx 0 rgba(44,36,22,.1), 0 18rpx 46rpx rgba(44,36,22,.16);
}

.detail-cover-image {
  display: block;
  width: 100%;
  height: 100%;
}

.cover-1 { background: #8b9d83; }
.cover-2 { background: #c66b3d; }
.cover-3 { background: #c08e3a; }
.cover-0 { background: #b08b6e; }

.cover-lines {
  padding: 64rpx 48rpx;
}

.cover-lines text {
  display: block;
  height: 16rpx;
  margin-bottom: 32rpx;
  border-radius: 12rpx;
  background: rgba(255,253,247,.65);
}

.cover-lines text:nth-child(2) { width: 70%; }
.cover-lines text:nth-child(3) { width: 48%; margin-top: 190rpx; }

.detail-card {
  padding: 28rpx;
  border-radius: 32rpx;
  background: #fffdf7;
}

.book-title {
  display: block;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 1.2;
}

.book-author {
  display: block;
  margin-top: 10rpx;
  color: #7a6e5e;
  font-size: 24rpx;
}

.meta-row {
  display: flex;
  gap: 16rpx;
  margin: 26rpx 0;
}

.meta-box {
  flex: 1;
  padding: 20rpx 10rpx;
  border-radius: 22rpx;
  background: #f8f4ea;
  text-align: center;
}

.meta-value {
  display: block;
  color: #606c38;
  font-size: 30rpx;
  font-weight: 900;
}

.meta-label {
  display: block;
  margin-top: 6rpx;
  color: #7a6e5e;
  font-size: 20rpx;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 18rpx;
  margin: 26rpx 0 18rpx;
}

.price {
  color: #c66b3d;
  font-size: 44rpx;
  font-weight: 900;
}

.origin {
  color: #b8aa92;
  font-size: 24rpx;
  text-decoration: line-through;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.section {
  margin-top: 28rpx;
}

.section-title {
  display: block;
  margin-bottom: 10rpx;
  font-size: 30rpx;
  font-weight: 900;
}

.paragraph {
  color: #7a6e5e;
  font-size: 25rpx;
  line-height: 1.7;
}

.bottom-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 18rpx;
  padding: 18rpx 28rpx 34rpx;
  background: #fffdf7;
  box-shadow: 0 -10rpx 30rpx rgba(44,36,22,.08);
}

.fav-btn {
  flex: 0 0 210rpx;
}

.cart-btn {
  flex: 1;
}
</style>
