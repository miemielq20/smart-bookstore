<template>
  <view class="app-tabbar">
    <view
      v-for="item in tabs"
      :key="item.key"
      class="tab-item"
      :class="{ active: current === item.key }"
      @tap="goTab(item)"
    >
      <u-icon
        v-if="item.key === 'cart'"
        name="shopping-cart"
        :color="current === item.key ? '#606C38' : '#7A6E5E'"
        size="24"
      />
      <image
        v-else
        class="tab-icon"
        :src="current === item.key ? item.activeIcon : item.icon"
        mode="aspectFit"
      />
      <text class="tab-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
type TabKey = 'home' | 'category' | 'cart' | 'mine'

interface TabItem {
  key: TabKey
  text: string
  url: string
  icon: string
  activeIcon: string
}

defineProps<{
  current: TabKey
}>()

const tabs: TabItem[] = [
  {
    key: 'home',
    text: '首页',
    url: '/pages/index/index',
    icon: '/static/tab/home.png',
    activeIcon: '/static/tab/home-active.png',
  },
  {
    key: 'category',
    text: '分类',
    url: '/pages/category/category',
    icon: '/static/tab/category.png',
    activeIcon: '/static/tab/category-active.png',
  },
  { key: 'cart', text: '购物车', url: '/pages/cart/cart', icon: '', activeIcon: '' },
  {
    key: 'mine',
    text: '我的',
    url: '/pages/mine/mine',
    icon: '/static/tab/mine.png',
    activeIcon: '/static/tab/mine-active.png',
  },
]

function goTab(item: TabItem) {
  uni.redirectTo({ url: item.url })
}
</script>

<style lang="scss" scoped>
.app-tabbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 99;
  display: flex;
  height: calc(112rpx + env(safe-area-inset-bottom));
  padding: 10rpx 20rpx calc(10rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid rgba(96, 108, 56, 0.1);
  background: #fffdf7;
  box-shadow: 0 -8rpx 24rpx rgba(44, 36, 22, 0.05);
}

.tab-item {
  display: flex;
  flex: 1;
  height: 92rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #7a6e5e;
}

.tab-item.active {
  color: #606c38;
}

.tab-icon {
  width: 44rpx;
  height: 44rpx;
}

.tab-text {
  margin-top: 4rpx;
  font-size: 22rpx;
  line-height: 1;
}
</style>
