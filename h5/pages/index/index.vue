<template>
  <view class="page" :style="pageStyle">
    <!-- #ifdef MP-WEIXIN -->
    <view class="mp-status-bar" :style="mpStatusBarStyle"></view>
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <u-navbar title="" :bg-color="theme.page" :border="false" :placeholder="true" :safe-area-inset-top="true" />
    <!-- #endif -->

    <view class="fixed-head home-fixed-head" :style="fixedHeadStyle">
    <view class="header">
      <view>
        <text class="eyebrow">智慧书城</text>
        <text class="title">今天读什么</text>
        <text class="sub">根据上架图书与分类更新</text>
      </view>
      <view class="cart-action" @tap="showCartTodo">
        <text class="bag-body"></text>
        <text class="bag-handle"></text>
      </view>
    </view>

    <u-search
      v-model="keyword"
      placeholder="书名 / 作者 / ISBN"
      :show-action="false"
      bg-color="#FFFDF7"
      border-color="rgba(96,108,56,.16)"
      height="46"
      @click="goSearch"
      @focus="goSearch"
    />
    </view>
    <!-- #ifndef MP-WEIXIN -->
    <view class="fixed-head-spacer"></view>
    <!-- #endif -->

    <swiper class="banner" circular indicator-dots indicator-color="rgba(255,253,247,.38)" indicator-active-color="#FFFDF7">
      <swiper-item v-for="(item, index) in displayBanners" :key="item.id">
        <view class="banner-card" :class="{ 'has-image': !!item.imageUrl }" @tap="handleBannerIndex(index)">
          <image v-if="item.imageUrl" class="banner-image" :src="item.imageUrl" mode="aspectFill" />
          <view class="banner-mask" />
          <view class="banner-copy">
            <text class="banner-title">{{ item.title }}</text>
            <text class="banner-desc">{{ getBannerDesc(item.linkType) }}</text>
            <text class="banner-pill">查看专题</text>
          </view>
          <view v-if="!item.imageUrl" class="book-stack">
            <text class="spine spine-a"></text>
            <text class="spine spine-b"></text>
            <text class="spine spine-c"></text>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <scroll-view class="category-scroll" scroll-x show-scrollbar="false">
      <view class="category-row">
        <u-tag
          v-for="category in displayCategories"
          :key="category.id"
          :text="category.name"
          :plain="category.name !== activeCategory"
          :bg-color="category.name === activeCategory ? '#606C38' : '#FFFDF7'"
          :border-color="category.name === activeCategory ? '#606C38' : 'rgba(96,108,56,.14)'"
          :color="category.name === activeCategory ? '#FFFDF7' : '#606C38'"
          shape="circle"
          size="large"
          @click="switchCategory(category.name)"
        />
      </view>
    </scroll-view>

    <view class="section-head">
      <view>
        <text class="section-title">热门图书</text>
      </view>
    </view>

    <view class="book-grid">
      <view
        v-for="book in displayHotBooks"
        :key="book.id"
        class="book-card"
        hover-class="tap-soft"
        @tap="goBookDetail(book.id)"
      >
        <view class="cover" :class="getCoverClass(book.id)" :style="getCoverStyle(book.coverUrl)">
          <view v-if="!book.coverUrl" class="cover-lines"><text></text><text></text><text></text></view>
        </view>
        <text class="book-title">{{ book.title }}</text>
        <text class="book-author">{{ book.author || '未知作者' }}</text>
        <view class="book-foot">
          <text class="price">¥{{ formatPrice(book.price) }}</text>
          <text class="stock">库存 {{ book.stock }}</text>
        </view>
      </view>
    </view>

    <view class="section-head next-section">
      <view>
        <text class="section-title">新书上架</text>
        <text class="section-sub">来自后台图书管理</text>
      </view>
    </view>

    <view class="book-list">
      <u-cell
        v-for="book in displayNewBooks"
        :key="book.id"
        :title="book.title"
        :label="`${book.author || '未知作者'} · ${book.reading || '适合日常阅读'}`"
        :border="false"
        clickable
        @click="goBookDetail(book.id)"
      >
        <template #icon>
          <view class="mini-cover" :class="getCoverClass(book.id)" :style="getCoverStyle(book.coverUrl)"></view>
        </template>
        <template #value>
          <text class="list-price">¥{{ formatPrice(book.price) }}</text>
        </template>
      </u-cell>
    </view>

    <u-gap height="24" bg-color="#F8F4EA" />
    <AppTabBar current="home" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppTabBar from '../../components/AppTabBar/AppTabBar.vue'
import { getBannersApi, getBooksApi, getCategoryOptionsApi } from '../../services/bookstore'
import type { BannerItem, BannerLinkType, BookItem, CategoryOption } from '../../types'

const fallbackBanners: BannerItem[] = [
  { id: 1, title: '本周新书已上架', imageUrl: '', linkUrl: null, linkType: 'CATEGORY', targetId: 1, sort: 1, status: 1, createdAt: '', updatedAt: '' },
]

const fallbackCategories: CategoryOption[] = [
  { id: 1, name: '文学' },
  { id: 2, name: '科技' },
  { id: 3, name: '经营' },
  { id: 4, name: '历史' },
  { id: 5, name: '心理' },
  { id: 6, name: '少儿' },
]

const fallbackBooks: BookItem[] = [
  createBook(1, '人类群星闪耀时', '斯蒂芬·茨威格', 39.8, 64, 1280, 9.1, '短篇历史叙事，适合碎片阅读'),
  createBook(2, '置身事内', '兰小欢', 56, 38, 980, 9.2, '理解中国经济运行'),
  createBook(3, '万历十五年', '黄仁宇', 42, 28, 860, 8.9, '制度与人物视角的历史读物'),
  createBook(4, '活着', '余华', 35, 42, 1500, 9.4, '经典文学入门'),
]

const theme = { page: '#F8F4EA' }
const keyword = ref('')
const mpStatusBarHeight = ref(0)
const activeCategory = ref('文学')
const banners = ref<BannerItem[]>([])
const categories = ref<CategoryOption[]>([])
const hotBooks = ref<BookItem[]>([])
const newBooks = ref<BookItem[]>([])

const displayBanners = computed(() => (banners.value.length ? banners.value : fallbackBanners))
const displayCategories = computed(() => (categories.value.length ? categories.value : fallbackCategories))
const displayHotBooks = computed(() => (hotBooks.value.length ? hotBooks.value : fallbackBooks).slice(0, 4))
const displayNewBooks = computed(() => (newBooks.value.length ? newBooks.value : fallbackBooks).slice(0, 3))
const mpStatusBarStyle = computed(() => ({ height: `${mpStatusBarHeight.value}px` }))
const fixedHeadStyle = computed(() => (mpStatusBarHeight.value ? { top: `${mpStatusBarHeight.value}px` } : {}))
const pageStyle = computed(() => (mpStatusBarHeight.value ? { paddingTop: `calc(${mpStatusBarHeight.value}px + 244rpx)` } : {}))
onLoad(() => {
  initStatusBar()
  loadHome()
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
  mpStatusBarHeight.value = Math.round(windowInfo?.statusBarHeight || systemInfo.statusBarHeight || statusFromMenu || 20)
  // #endif
}

async function loadHome() {
  try {
    const [bannerRes, categoryRes, newRes] = await Promise.all([
      getBannersApi({ page: 1, pageSize: 5, status: 1 }),
      getCategoryOptionsApi(),
      getBooksApi({ page: 1, pageSize: 3, status: 1, sort: 'createdAt', order: 'desc' }),
    ])
    banners.value = bannerRes.data.list
    categories.value = categoryRes.data
    newBooks.value = newRes.data.list
    if (categories.value[0]?.name) {
      activeCategory.value = categories.value[0].name
      await loadHotBooks(categories.value[0].name)
    } else {
      await loadHotBooks()
    }
  } catch {
    banners.value = []
    categories.value = []
    hotBooks.value = []
    newBooks.value = []
  }
}

function switchCategory(name: string) {
  activeCategory.value = name
  loadHotBooks(name)
}

async function loadHotBooks(category?: string) {
  try {
    const res = await getBooksApi({
      page: 1,
      pageSize: 4,
      status: 1,
      category,
      sort: 'salesCount',
      order: 'desc',
    })
    hotBooks.value = res.data.list
  } catch {
    hotBooks.value = []
  }
}

function goCategory() {
  uni.switchTab({ url: '/pages/category/category' })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/search' })
}

function showCartTodo() {
  uni.navigateTo({ url: '/pages/cart/cart' })
}

function goBookDetail(id: number) {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function handleBannerIndex(index: number) {
  const banner = displayBanners.value[index]
  if (!banner) return
  if (banner.linkType === 'BOOK' && banner.targetId) goBookDetail(banner.targetId)
  else if (banner.linkType === 'CATEGORY') uni.switchTab({ url: '/pages/category/category' })
}

function getBannerDesc(linkType: BannerLinkType) {
  const map: Record<BannerLinkType, string> = {
    BOOK: '运营位可直达详情',
    CATEGORY: '运营位可跳转分类频道',
    URL: '运营位可跳转活动页面',
    NONE: '运营位用于首页展示',
  }
  return map[linkType]
}

function getCoverClass(id: number) {
  return `cover-${id % 4}`
}

function getCoverStyle(url: string | null) {
  if (!url) return {}
  return {
    backgroundImage: `url(${url})`,
  }
}

function formatPrice(value: number | string | null) {
  return Number(value ?? 0).toFixed(2)
}

function createBook(id: number, title: string, author: string, price: number, stock: number, salesCount: number, rating: number, reading: string): BookItem {
  return { id, title, author, isbn: null, coverUrl: null, price, originalPrice: null, description: null, language: '中文', stock, salesCount, viewCount: 0, rating, status: 1, createdAt: '', updatedAt: '', deletedAt: null, reading }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 0 28rpx calc(132rpx + env(safe-area-inset-bottom));
  background: #f8f4ea;
  color: #2c2416;
}

.fixed-head-spacer {
  height: 244rpx;
}

.mp-status-bar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 49;
  background: #f8f4ea;
}

.fixed-head {
  position: fixed;
  top: calc(44px + env(safe-area-inset-top));
  right: 0;
  left: 0;
  z-index: 50;
  padding: 0 28rpx 20rpx;
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

.eyebrow,
.sub,
.section-sub,
.book-author,
.stock {
  display: block;
  color: #7a6e5e;
}

.eyebrow {
  margin-bottom: 8rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.title {
  display: block;
  font-size: 50rpx;
  font-weight: 900;
  line-height: 1.1;
}

.sub {
  margin-top: 8rpx;
  font-size: 24rpx;
}

.cart-action {
  position: relative;
  width: 88rpx;
  height: 88rpx;
  margin-top: 4rpx;
  border-radius: 50%;
  background: #606c38;
  flex-shrink: 0;
}

.bag-body {
  position: absolute;
  left: 25rpx;
  top: 35rpx;
  width: 38rpx;
  height: 30rpx;
  border: 5rpx solid #fffdf7;
  border-radius: 9rpx;
}

.bag-body::before,
.bag-body::after {
  position: absolute;
  top: 8rpx;
  width: 5rpx;
  height: 5rpx;
  border-radius: 50%;
  background: #fffdf7;
  content: "";
}

.bag-body::before {
  left: 7rpx;
}

.bag-body::after {
  right: 7rpx;
}

.bag-handle {
  position: absolute;
  left: 34rpx;
  top: 24rpx;
  width: 20rpx;
  height: 20rpx;
  border: 5rpx solid #fffdf7;
  border-bottom: 0;
  border-radius: 20rpx 20rpx 0 0;
}

.banner {
  display: block;
  height: 300rpx;
  margin-top: 28rpx;
  overflow: hidden;
  border-radius: 36rpx;
}

.banner-card {
  position: relative;
  height: 300rpx;
  overflow: hidden;
  border-radius: 36rpx;
  background: linear-gradient(118deg, #24433b, #606c38);
}

.banner-image {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
}

.banner-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(90deg, rgba(36, 67, 59, 0.78), rgba(36, 67, 59, 0.28) 58%, rgba(36, 67, 59, 0.06));
}

.banner-card.has-image {
  background: #24433b;
}

.banner-copy {
  position: relative;
  z-index: 2;
  width: 430rpx;
  padding: 34rpx;
}

.banner-title {
  display: block;
  color: #fffdf7;
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1.16;
}

.banner-desc {
  display: block;
  margin: 16rpx 0 22rpx;
  color: rgba(255, 253, 247, 0.82);
  font-size: 23rpx;
}

.banner-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 116rpx;
  height: 48rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: #c66b3d;
  color: #fffdf7;
  font-size: 23rpx;
  font-weight: 800;
  line-height: 48rpx;
}

.book-stack {
  position: absolute;
  right: 22rpx;
  bottom: 22rpx;
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
}

.spine {
  display: block;
  width: 42rpx;
  border-radius: 12rpx;
}

.spine-a {
  height: 128rpx;
  background: rgba(255, 253, 247, 0.22);
}

.spine-b {
  height: 172rpx;
  background: #b08b6e;
}

.spine-c {
  height: 104rpx;
  background: #c08e3a;
}

.category-scroll {
  width: 100%;
  margin: 26rpx 0;
  white-space: nowrap;
}

.category-row {
  display: flex;
  gap: 16rpx;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin: 8rpx 0 20rpx;
}

.section-title {
  display: block;
  font-size: 34rpx;
  font-weight: 900;
}

.section-sub {
  margin-top: 6rpx;
  font-size: 22rpx;
}

.book-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.book-card {
  width: calc((100% - 20rpx) / 2);
  padding: 18rpx;
  border-radius: 28rpx;
  background: #fffdf7;
  overflow: hidden;
}

.cover {
  width: 100%;
  height: 244rpx;
  margin-bottom: 18rpx;
  overflow: hidden;
  border-radius: 22rpx;
  background: #8b9d83;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  box-shadow: inset -20rpx 0 rgba(44, 36, 22, 0.08);
}

.cover-1 { background-color: #8b9d83; }
.cover-2 { background-color: #c66b3d; }
.cover-3 { background-color: #c08e3a; }
.cover-0 { background-color: #b08b6e; }

.cover-lines {
  padding: 34rpx 28rpx;
}

.cover-lines text {
  display: block;
  height: 12rpx;
  margin-bottom: 24rpx;
  border-radius: 10rpx;
  background: rgba(255, 253, 247, 0.66);
}

.cover-lines text:nth-child(2) { width: 68%; }
.cover-lines text:nth-child(3) { width: 46%; margin-top: 88rpx; }

.book-title {
  display: block;
  overflow: hidden;
  color: #2c2416;
  font-size: 27rpx;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  margin-top: 8rpx;
  overflow: hidden;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-top: 14rpx;
}

.price,
.list-price {
  color: #c66b3d;
  font-size: 29rpx;
  font-weight: 900;
}

.stock {
  font-size: 20rpx;
}

.next-section {
  margin-top: 34rpx;
}

.book-list {
  overflow: hidden;
  border-radius: 28rpx;
  background: #fffdf7;
}

.mini-cover {
  width: 108rpx;
  height: 144rpx;
  margin-right: 18rpx;
  border-radius: 20rpx;
  background: #8b9d83;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  box-shadow: inset -14rpx 0 rgba(44, 36, 22, 0.1);
}
</style>
