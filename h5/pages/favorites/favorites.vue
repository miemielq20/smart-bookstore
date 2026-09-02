<template>
  <view class="page">
    <u-navbar
      title=""
      :bg-color="theme.page"
      :border="false"
      :placeholder="true"
      :safe-area-inset-top="true"
    />
    <view class="topline"
      ><view class="back" @tap="goBack"><u-icon name="arrow-left" color="#FFFDF7" size="21" /></view
      ><view><text class="title">我的收藏</text><text class="sub">已收藏的图书</text></view></view
    >
    <view v-if="loading" class="loading"><u-loading-icon color="#606C38" /></view>
    <u-empty v-else-if="!items.length" mode="list" text="暂无收藏" margin-top="140" />
    <view v-else class="book-list">
      <view v-for="item in items" :key="item.id" class="book-row" @tap="openDetail(item.book.id)">
        <view class="cover" :style="coverStyle(item.book.coverUrl)"></view>
        <view class="copy"
          ><text class="book-title">{{ item.book.title }}</text
          ><text class="author">{{ item.book.author || '未知作者' }}</text
          ><text class="price">¥{{ Number(item.book.price).toFixed(2) }}</text></view
        >
        <u-icon name="trash" color="#C66B3D" size="20" @tap.stop="remove(item.book.id)" />
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getFavoritesApi, removeFavoriteApi } from '../../services/bookstore'
import { normalizeAssetUrl } from '../../services/assets'
import type { BookItem } from '../../types/book'

const theme = { page: '#F8F4EA' }
const loading = ref(true)
const items = ref<Array<{ id: number; book: BookItem }>>([])
onShow(load)
async function load() {
  loading.value = true
  try {
    items.value = (await getFavoritesApi()).data
  } finally {
    loading.value = false
  }
}
function openDetail(id: number) {
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}
function goBack() {
  uni.navigateBack({ delta: 1 })
}
function coverStyle(url: string | null) {
  // 收藏页使用真实封面地址，没有封面时保留 CSS 占位背景。
  return url ? { backgroundImage: `url(${normalizeAssetUrl(url)})` } : {}
}
function remove(bookId: number) {
  uni.showModal({
    title: '取消收藏',
    content: '确定取消收藏这本书吗？',
    confirmColor: '#E53935',
    cancelColor: '#2F80ED',
    success: async ({ confirm }) => {
      if (confirm) {
        await removeFavoriteApi(bookId)
        await load()
      }
    },
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 0 28rpx 60rpx;
  background: #f8f4ea;
  color: #2c2416;
}
.topline {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 24rpx 4rpx 30rpx;
}
.back {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #24433b;
}
.title {
  display: block;
  font-family: Georgia, serif;
  font-size: 42rpx;
  font-weight: 700;
}
.sub {
  display: block;
  margin-top: 7rpx;
  color: #7a6e5e;
  font-size: 20rpx;
}
.loading {
  text-align: center;
  padding-top: 120rpx;
}
.book-list {
  overflow: hidden;
  border-radius: 22rpx;
  background: #fffdf7;
}
.book-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-height: 172rpx;
  padding: 18rpx 22rpx;
  border-bottom: 1rpx solid rgba(159, 147, 129, 0.16);
}
.book-row:last-child {
  border-bottom: 0;
}
.cover {
  width: 100rpx;
  height: 134rpx;
  flex: 0 0 100rpx;
  border-radius: 12rpx;
  background: #d4b895 linear-gradient(145deg, #606c38, #c66b3d);
  background-position: center;
  background-size: cover;
}
.copy {
  min-width: 0;
  flex: 1;
}
.book-title {
  display: block;
  overflow: hidden;
  font-size: 27rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.author {
  display: block;
  margin-top: 8rpx;
  color: #7a6e5e;
  font-size: 21rpx;
}
.price {
  display: block;
  margin-top: 18rpx;
  color: #c66b3d;
  font-size: 28rpx;
  font-weight: 900;
}
</style>
