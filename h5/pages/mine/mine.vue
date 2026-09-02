<template>
  <view class="page">
    <u-navbar
      title=""
      :bg-color="theme.page"
      :border="false"
      :placeholder="true"
      :safe-area-inset-top="true"
    />

    <view class="topline">
      <view class="title-block">
        <text class="title">我的书城</text>
        <text class="subtitle">订单状态与售后入口集中处理</text>
      </view>
    </view>

    <view class="profile" @tap="openProfile">
      <view class="profile-copy">
        <text class="label">账号资料</text>
        <text class="name">{{ userName }}</text>
      </view>
      <view class="profile-mark">
        <u-icon name="account" color="#FFFDF7" size="27" />
      </view>
      <view class="stats">
        <view class="stat" @tap.stop="goOrders('SHIPPED')">
          <text class="num">{{ counts.receiving }}</text>
          <text class="stat-label">待收货</text>
        </view>
        <view class="stat" @tap.stop="goFavorites">
          <text class="num">{{ counts.favorites }}</text>
          <text class="stat-label">收藏</text>
        </view>
        <view class="stat" @tap.stop="goOrders('REFUNDING')">
          <text class="num">{{ counts.refunding }}</text>
          <text class="stat-label">退款中</text>
        </view>
      </view>
    </view>

    <view class="section-row" @tap="goOrders">
      <text>最近订单</text>
      <text class="section-note">查看全部</text>
    </view>
    <view class="empty-panel" @tap="goOrders">
      <u-icon name="order" color="#B7AA96" size="27" />
      <view class="empty-copy">
        <text>查看我的订单</text>
        <text>订单状态与支付结果实时同步</text>
      </view>
      <u-icon name="arrow-right" color="#B7AA96" size="17" />
    </view>
    <view class="section-row address-heading">
      <text>默认地址</text>
      <text class="section-note">收货信息</text>
    </view>
    <view class="empty-panel address-panel" @tap="goAddresses">
      <u-icon name="map" color="#C66B3D" size="27" />
      <view class="empty-copy">
        <text>管理收货地址</text>
        <text>添加地址后可用于订单配送</text>
      </view>
      <u-icon name="arrow-right" color="#C66B3D" size="18" />
    </view>

    <view class="settings-list">
      <view class="setting-row" @tap="openProfile">
        <view class="setting-icon">
          <u-icon name="account" color="#606C38" size="20" />
        </view>
        <view class="setting-copy">
          <text>个人资料</text>
          <text>昵称、头像、手机号、邮箱</text>
        </view>
        <u-icon name="arrow-right" color="#B7AA96" size="17" />
      </view>
      <view class="setting-row" @tap="goCart">
        <view class="setting-icon">
          <u-icon name="shopping-cart" color="#606C38" size="20" />
        </view>
        <view class="setting-copy">
          <text>购物车</text>
          <text>已选图书与库存校验</text>
        </view>
        <u-icon name="arrow-right" color="#B7AA96" size="17" />
      </view>
      <view class="setting-row" @tap="showAiTip">
        <view class="setting-icon">
          <u-icon name="star" color="#606C38" size="20" />
        </view>
        <view class="setting-copy">
          <text>AI 推荐偏好</text>
          <text>根据需求获取图书推荐</text>
        </view>
        <u-icon name="arrow-right" color="#B7AA96" size="17" />
      </view>
      <view class="setting-row" @tap="showSettings">
        <view class="setting-icon">
          <u-icon name="setting" color="#606C38" size="20" />
        </view>
        <view class="setting-copy">
          <text>设置</text>
          <text>通知、隐私与应用偏好</text>
        </view>
        <u-icon name="arrow-right" color="#B7AA96" size="17" />
      </view>
    </view>
    <AppTabBar current="mine" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppTabBar from '../../components/AppTabBar/AppTabBar.vue'
import { getFavoritesApi, getOrdersApi } from '../../services/bookstore'
import type { Order } from '../../types/order'

const theme = { page: '#F8F4EA' }
const user = ref<{
  username?: string
  nickname?: string
}>({})
const userName = computed(() => user.value.nickname || user.value.username || '登录后查看账户')
const counts = ref({ receiving: 0, favorites: 0, refunding: 0 })
onShow(() => {
  user.value = uni.getStorageSync('user') || {}
  loadCounts()
})
async function loadCounts() {
  // 统计直接来自订单和收藏接口，页面每次显示时都会同步最新数据库状态。
  try {
    const [orderResponse, favoriteResponse] = await Promise.all([getOrdersApi(), getFavoritesApi()])
    const orders = orderResponse.data as Order[]
    counts.value = {
      receiving: orders.filter((order) => order.status === 'SHIPPED').length,
      favorites: favoriteResponse.data.length,
      refunding: orders.filter((order) => order.status === 'REFUNDING').length,
    }
  } catch {
    counts.value = { receiving: 0, favorites: 0, refunding: 0 }
  }
}
function goCart() {
  uni.navigateTo({ url: '/pages/cart/cart' })
}
function goOrders(status?: string) {
  // 直接使用 @tap="goOrders" 时，uni-app 会把点击事件传入第一个参数，必须只接受合法状态。
  const validStatuses = ['PENDING', 'PAID', 'SHIPPED', 'AFTER_SALE', 'REFUNDING']
  const nextStatus = typeof status === 'string' && validStatuses.includes(status) ? status : ''
  uni.navigateTo({ url: `/pages/orders/orders${nextStatus ? `?status=${nextStatus}` : ''}` })
}
function goFavorites() {
  uni.navigateTo({ url: '/pages/favorites/favorites' })
}

function goAddresses() {
  uni.navigateTo({ url: '/pages/addresses/addresses' })
}

function openProfile() {
  uni.navigateTo({ url: '/pages/profile/profile' })
}

function showSettings() {
  uni.navigateTo({ url: '/pages/settings/settings' })
}

function showAiTip() {
  uni.navigateTo({ url: '/pages/ai/ai' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 0 28rpx calc(142rpx + env(safe-area-inset-bottom));
  background: #f8f4ea;
  color: #2c2416;
}

.topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10rpx 4rpx 26rpx;
}

.title-block {
  min-width: 0;
}

.title {
  display: block;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 45rpx;
  font-weight: 700;
  line-height: 1.1;
}

.subtitle {
  display: block;
  margin-top: 8rpx;
  color: #7a6e5e;
  font-size: 21rpx;
}

.round-button {
  display: flex;
  width: 70rpx;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fffdf7;
  box-shadow: 0 8rpx 20rpx rgba(44, 36, 22, 0.06);
}

.profile {
  position: relative;
  min-height: 246rpx;
  margin-bottom: 30rpx;
  padding: 30rpx;
  overflow: hidden;
  border-radius: 28rpx;
  background: #24433b;
  color: #fffdf7;
  box-shadow: 0 14rpx 28rpx rgba(36, 67, 59, 0.12);
}

.profile::after {
  position: absolute;
  right: -20rpx;
  bottom: -42rpx;
  width: 190rpx;
  height: 190rpx;
  border: 18rpx solid rgba(255, 253, 247, 0.1);
  border-radius: 50%;
  content: '';
}

.profile-copy {
  position: relative;
  z-index: 1;
}

.label {
  display: block;
  color: rgba(255, 253, 247, 0.7);
  font-size: 22rpx;
}

.name {
  display: block;
  margin-top: 9rpx;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 40rpx;
  font-weight: 700;
}

.profile-mark {
  position: absolute;
  top: 28rpx;
  right: 30rpx;
  display: flex;
  width: 92rpx;
  height: 92rpx;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
  background: #c66b3d;
  box-shadow: inset 0 0 0 12rpx rgba(255, 253, 247, 0.18);
}

.stats {
  position: absolute;
  right: 30rpx;
  bottom: 28rpx;
  left: 30rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.stat {
  padding: 14rpx 8rpx;
  border-radius: 17rpx;
  background: rgba(255, 253, 247, 0.11);
  text-align: center;
}

.num {
  display: block;
  font-size: 30rpx;
  font-weight: 900;
}

.stat-label {
  display: block;
  margin-top: 4rpx;
  color: rgba(255, 253, 247, 0.68);
  font-size: 19rpx;
}

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 4rpx 14rpx;
  color: #2c2416;
  font-size: 27rpx;
  font-weight: 800;
}

.section-note {
  color: #a0927f;
  font-size: 19rpx;
  font-weight: 400;
}

.empty-panel {
  display: flex;
  min-height: 104rpx;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 25rpx;
  padding: 20rpx 22rpx;
  border: 1rpx solid rgba(159, 147, 129, 0.18);
  border-radius: 20rpx;
  background: #fffdf7;
}

.empty-copy {
  min-width: 0;
  flex: 1;
}

.empty-copy text {
  display: block;
}

.empty-copy text:first-child {
  color: #2c2416;
  font-size: 25rpx;
  font-weight: 800;
}

.empty-copy text:last-child {
  margin-top: 6rpx;
  color: #9f9381;
  font-size: 19rpx;
}

.address-heading {
  margin-top: 4rpx;
}

.address-panel {
  margin-bottom: 28rpx;
}

.settings-list {
  overflow: hidden;
  border-radius: 22rpx;
  background: #fffdf7;
}

.setting-row {
  display: flex;
  min-height: 98rpx;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid rgba(159, 147, 129, 0.16);
}

.setting-row:last-child {
  border-bottom: 0;
}

.setting-icon {
  display: flex;
  width: 52rpx;
  height: 52rpx;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: #e8dcc7;
}

.setting-copy {
  min-width: 0;
  flex: 1;
}

.setting-copy text {
  display: block;
}

.setting-copy text:first-child {
  color: #2c2416;
  font-size: 25rpx;
  font-weight: 800;
}

.setting-copy text:last-child {
  margin-top: 5rpx;
  color: #9f9381;
  font-size: 19rpx;
}

/* #ifdef MP-WEIXIN */
.page {
  padding-top: calc(126rpx + env(safe-area-inset-top));
}
/* #endif */
</style>
