<template>
  <view class="page">
    <u-navbar
      title=""
      :bg-color="theme.page"
      :border="false"
      :placeholder="true"
      :safe-area-inset-top="true"
    />
    <view class="page-topbar"
      ><view class="back-action" @tap="goBack"
        ><u-icon name="arrow-left" color="#FFFDF7" size="21" /></view
      ><text class="page-title">系统设置</text></view
    >
    <view class="intro"
      ><text class="title">设置</text><text class="subtitle">通知、隐私与应用偏好</text></view
    >
    <view class="group-title">偏好设置</view>
    <view class="setting-panel">
      <view class="setting-row"
        ><view class="setting-icon"><u-icon name="bell" color="#606C38" size="20" /></view
        ><view class="setting-copy"><text>消息通知</text><text>订单状态与售后进度提醒</text></view
        ><u-switch v-model="settings.notice" size="22" active-color="#C66B3D"
      /></view>
      <view class="setting-row"
        ><view class="setting-icon"><u-icon name="lock" color="#606C38" size="20" /></view
        ><view class="setting-copy"><text>隐私保护</text><text>保护账号与购买记录</text></view
        ><u-switch v-model="settings.privacy" size="22" active-color="#C66B3D"
      /></view>
    </view>
    <view class="group-title">应用管理</view>
    <view class="setting-panel">
      <view class="setting-row" @tap="clearCache"
        ><view class="setting-icon"><u-icon name="trash" color="#C66B3D" size="20" /></view
        ><view class="setting-copy"><text>清理缓存</text><text>清除本地临时数据</text></view
        ><text class="action-text">{{ cacheSize }}</text
        ><u-icon name="arrow-right" color="#B7AA96" size="17"
      /></view>
      <view class="setting-row" @tap="showAbout"
        ><view class="setting-icon"><u-icon name="info-circle" color="#606C38" size="20" /></view
        ><view class="setting-copy"><text>关于书城</text><text>版本与服务信息</text></view
        ><u-icon name="arrow-right" color="#B7AA96" size="17"
      /></view>
    </view>
    <u-button class="logout" type="default" text="退出登录" @click="logout" />
  </view>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
const theme = { page: '#F8F4EA' }
const settings = reactive({ notice: true, privacy: true })
const cacheSize = ref('')
function goBack() {
  uni.navigateBack({ delta: 1 })
}

// 清理本地临时缓存，并更新页面上的清理状态。
function clearCache() {
  uni.removeStorageSync('cartKey')
  cacheSize.value = '已清理'
  uni.showToast({ title: '缓存已清理', icon: 'success' })
}

// 展示书城的应用说明。
function showAbout() {
  uni.showModal({ title: '关于书城', content: '智慧书城', showCancel: false })
}

// 清除登录信息并返回登录页。
function logout() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('user')
  uni.showToast({ title: '已退出登录', icon: 'success' })
  setTimeout(() => uni.redirectTo({ url: '/pages/login/login' }), 350)
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: calc(18rpx + env(safe-area-inset-top)) 28rpx 60rpx;
  background: #f8f4ea;
  color: #2c2416;
}
.page-topbar {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 12rpx 0 26rpx;
}
.back-action {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #24433b;
}
.page-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 42rpx;
  font-weight: 700;
}
.intro {
  margin: 28rpx 4rpx 36rpx;
}
.title {
  display: block;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 46rpx;
  font-weight: 700;
}
.subtitle {
  display: block;
  margin-top: 8rpx;
  color: #7a6e5e;
  font-size: 21rpx;
}
.group-title {
  margin: 0 4rpx 14rpx;
  color: #7a6e5e;
  font-size: 22rpx;
  font-weight: 700;
}
.setting-panel {
  margin-bottom: 30rpx;
  overflow: hidden;
  border-radius: 22rpx;
  background: #fffdf7;
}
.setting-row {
  display: flex;
  min-height: 106rpx;
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
  width: 54rpx;
  height: 54rpx;
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
.action-text {
  color: #a0927f;
  font-size: 20rpx;
}
.logout {
  margin-top: 14rpx;
  border: 1rpx solid #e2c9bb;
  border-radius: 18rpx;
  color: #c66b3d;
  background: #fff7f3;
}
</style>
