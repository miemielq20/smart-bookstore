<template>
  <view class="page">
     <u-navbar title="" :bg-color="theme.page" :border="false" :placeholder="true" :safe-area-inset-top="true" />
    <view class="profile">
      <text class="label">读者账户</text>
      <text class="name">读者小明</text>
      <view class="stats">
        <view><text class="num">2</text><text class="stat-label">待收货</text></view>
        <view><text class="num">8</text><text class="stat-label">收藏</text></view>
        <view><text class="num">1</text><text class="stat-label">退款中</text></view>
      </view>
    </view>

    <u-cell-group :border="false" custom-style="border-radius: 28rpx; overflow: hidden; background: #FFFDF7;">
      <u-cell title="我的订单" label="待付款、待收货、售后" icon="order" is-link :border="false" />
      <u-cell title="购物车" label="已选图书与库存校验" icon="shopping-cart" is-link :border="false" />
      <u-cell title="收货地址" label="默认地址用于订单快照" icon="map" is-link :border="false" />
      <u-cell title="个人资料" label="昵称、头像、手机号、邮箱" icon="account" is-link :border="false" />
    </u-cell-group>
    <AppTabBar current="mine" />
  </view>
</template>

<script lang="ts" setup>
import AppTabBar from '../../components/AppTabBar/AppTabBar.vue'

const theme = { page: '#F8F4EA' }
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: calc(24rpx + env(safe-area-inset-top)) 28rpx calc(132rpx + env(safe-area-inset-bottom));
  background: #f8f4ea;
  color: #2c2416;
}

/* #ifdef MP-WEIXIN */
.page {
  padding-top: calc(132rpx + env(safe-area-inset-top));
}
/* #endif */

.profile {
  margin-bottom: 24rpx;
  padding: 36rpx;
  border-radius: 36rpx;
  background: linear-gradient(118deg, #24433b, #606c38);
  color: #fffdf7;
}

.label {
  display: block;
  color: rgba(255,253,247,.72);
  font-size: 24rpx;
}

.name {
  display: block;
  margin-top: 10rpx;
  font-size: 46rpx;
  font-weight: 900;
}

.stats {
  display: flex;
  gap: 18rpx;
  margin-top: 28rpx;
}

.stats view {
  flex: 1;
  padding: 18rpx 10rpx;
  border-radius: 22rpx;
  background: rgba(255,253,247,.12);
  text-align: center;
}

.num {
  display: block;
  font-size: 32rpx;
  font-weight: 900;
}

.stat-label {
  display: block;
  margin-top: 4rpx;
  color: rgba(255,253,247,.7);
  font-size: 20rpx;
}
</style>
