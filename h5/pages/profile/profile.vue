<template>
  <view class="page">
    <u-navbar title="" :bg-color="theme.page" :border="false" :placeholder="true" :safe-area-inset-top="true" />
    <view class="page-topbar"><view class="back-action" @tap="goBack"><u-icon name="arrow-left" color="#FFFDF7" size="21" /></view><text class="page-title">个人资料</text></view>
    <view class="profile-card">
      <view class="avatar"><u-icon name="account" color="#FFFDF7" size="30" /></view>
      <view class="profile-copy"><text class="eyebrow">账号资料</text><text class="name">{{ form.nickname || form.username || '未登录' }}</text><text class="account">账号：{{ form.username || '暂无账号' }}</text></view>
    </view>
    <view class="section-title"><text>基本信息</text><text>用于订单与账户识别</text></view>
    <view class="form-panel">
      <view class="field"><text class="field-label">用户名</text><view class="field-value readonly">{{ form.username || '暂无账号' }}</view></view>
      <view class="field"><text class="field-label">昵称</text><view class="field-value"><u-input v-model="form.nickname" placeholder="请输入昵称" border="none" maxlength="50" /></view></view>
      <view class="field"><text class="field-label">手机号</text><view class="field-value"><u-input v-model="form.phone" placeholder="请输入手机号" border="none" maxlength="20" /></view></view>
      <view class="field"><text class="field-label">邮箱</text><view class="field-value"><u-input v-model="form.email" placeholder="请输入邮箱" border="none" maxlength="100" /></view></view>
    </view>
    <u-button class="save-button" color="#24433B" text="保存资料" :loading="saving" @click="save" />
    <view class="hint"><u-icon name="lock" color="#A0927F" size="15" /><text>账号安全信息由系统统一保护</text></view>
  </view>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getProfileApi, updateProfileApi } from '../../services/auth'

const theme = { page: '#F8F4EA' }
const saving = ref(false)
const form = reactive({ username: '', nickname: '', phone: '', email: '' })
onShow(async () => {
  // 进入页面优先从数据库读取，避免资料页只显示旧缓存。
  Object.assign(form, uni.getStorageSync('user') || {})
  if (!uni.getStorageSync('token')) return
  try { Object.assign(form, (await getProfileApi()).data) } catch { /* 请求层统一提示错误 */ }
})
function goBack() { uni.navigateBack({ delta: 1 }) }
async function save() {
  if (!uni.getStorageSync('token')) return uni.navigateTo({ url: '/pages/login/login?redirect=/pages/profile/profile' })
  saving.value = true
  try {
    // 保存成功后同步本地缓存，让“我的”页立即显示最新昵称。
    const res = await updateProfileApi({ nickname: form.nickname, phone: form.phone, email: form.email })
    Object.assign(form, res.data)
    uni.setStorageSync('user', { ...uni.getStorageSync('user'), ...res.data })
    uni.showToast({ title: '资料已保存', icon: 'success' })
  } finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: calc(18rpx + env(safe-area-inset-top)) 28rpx 60rpx; background: #f8f4ea; color: #2c2416; }
.page-topbar { display: flex; align-items: center; gap: 18rpx; margin: 12rpx 0 26rpx; }.back-action { display: flex; width: 72rpx; height: 72rpx; align-items: center; justify-content: center; border-radius: 24rpx; background: #24433b; }.page-title { font-family: Georgia, 'Times New Roman', serif; font-size: 42rpx; font-weight: 700; }
.profile-card { position: relative; display: flex; align-items: center; min-height: 190rpx; margin: 28rpx 0 34rpx; padding: 28rpx; overflow: hidden; border-radius: 28rpx; background: #24433b; color: #fffdf7; box-shadow: 0 14rpx 28rpx rgba(36,67,59,.12); }.profile-card::after { position: absolute; right: -30rpx; bottom: -70rpx; width: 200rpx; height: 200rpx; border: 18rpx solid rgba(255,253,247,.1); border-radius: 50%; content: ''; }.avatar { position: relative; z-index: 1; display: flex; width: 100rpx; height: 100rpx; align-items: center; justify-content: center; margin-right: 22rpx; border-radius: 30rpx; background: #c66b3d; }.profile-copy { position: relative; z-index: 1; }.eyebrow { display: block; color: rgba(255,253,247,.7); font-size: 21rpx; }.name { display: block; margin-top: 8rpx; font-family: Georgia, 'Times New Roman', serif; font-size: 38rpx; font-weight: 700; }.account { display: block; margin-top: 8rpx; color: rgba(255,253,247,.65); font-size: 19rpx; }
.section-title { display: flex; align-items: baseline; justify-content: space-between; margin: 0 4rpx 14rpx; }.section-title text:first-child { font-size: 28rpx; font-weight: 800; }.section-title text:last-child { color: #a0927f; font-size: 19rpx; }.form-panel { overflow: hidden; border-radius: 22rpx; background: #fffdf7; }.field { display: flex; min-height: 96rpx; align-items: center; gap: 20rpx; padding: 16rpx 22rpx; border-bottom: 1rpx solid rgba(159,147,129,.16); }.field:last-child { border-bottom: 0; }.field-label { width: 120rpx; flex: 0 0 120rpx; color: #7a6e5e; font-size: 23rpx; }.field-value { min-width: 0; flex: 1; color: #2c2416; font-size: 24rpx; }.field-value :deep(.u-input) { padding: 0 !important; }.readonly { color: #a0927f; }.save-button { margin-top: 28rpx; border-radius: 18rpx; }.hint { display: flex; align-items: center; justify-content: center; gap: 6rpx; margin-top: 22rpx; color: #a0927f; font-size: 19rpx; }
</style>
