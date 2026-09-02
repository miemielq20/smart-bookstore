<template>
  <view class="screen">
    <u-navbar title="" bg-color="#F7F0E1" :border="false" :placeholder="true" :safe-area-inset-top="true" />
    <view class="page-topbar" @tap="goBack"><view class="back-action"><u-icon name="arrow-left" color="#FFFDF7" size="18" /></view><text>返回上一级</text></view>
    <view class="auth-title">
      <text class="title">创建你的账号</text>
      <text class="subtitle">注册后即可收藏图书并完成购买</text>
    </view>
    <view class="field"><text>账号</text><view class="field-box"><u-input v-model="form.username" placeholder="请输入用户名" border="none" clearable maxlength="50" /></view></view>
    <view class="field"><text>密码</text><view class="field-box"><u-input v-model="form.password" type="password" placeholder="至少 6 位密码" border="none" clearable maxlength="50" /></view></view>
    <view class="field"><text>确认密码</text><view class="field-box"><u-input v-model="form.confirmPassword" type="password" placeholder="再次输入密码" border="none" clearable maxlength="50" /></view></view>
    <view class="field"><text>验证码</text><view class="captcha-row"><view class="field-box captcha-input"><u-input v-model="form.captcha" placeholder="输入验证码" border="none" maxlength="4" /></view><view class="captcha-img" @tap="refreshCaptcha"><image v-if="captcha.img" class="captcha-image" :src="captcha.img" mode="aspectFill" /><text v-else class="captcha-placeholder">点击获取验证码</text></view></view></view>
    <u-button class="primary-action" color="#24433B" :loading="submitting" text="创建账号" @click="submit" />
    <view class="login-row"><text>已有账号？</text><text class="login-link" @tap="goBack">返回登录</text></view>
  </view>
</template>

<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { reactive, ref } from 'vue'
import { getCaptchaApi, registerApi } from '../../services/auth'

const form = reactive({ username: '', password: '', confirmPassword: '', captcha: '', captchaId: '' })
const captcha = reactive({ img: '' })
const submitting = ref(false)
const redirect = ref('/pages/cart/cart')

onLoad((options = {}) => {
  const query = options as Record<string, string | undefined>
  redirect.value = query.redirect ? decodeURIComponent(query.redirect) : '/pages/cart/cart'
  refreshCaptcha()
})

async function refreshCaptcha() {
  try {
    const res = await getCaptchaApi()
    captcha.img = res.data.img
    form.captchaId = res.data.uuid
    form.captcha = ''
  } catch {
    captcha.img = ''
    form.captchaId = ''
  }
}

async function submit() {
  if (!form.username || !form.password || !form.confirmPassword || !form.captcha || !form.captchaId) {
    uni.showToast({ title: '请填写完整注册信息', icon: 'none' })
    return
  }
  if (form.password !== form.confirmPassword) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }
  if (form.password.length < 6) {
    uni.showToast({ title: '密码长度不能少于6位', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const res = await registerApi({ ...form })
    uni.setStorageSync('token', res.data.accessToken)
    uni.setStorageSync('user', res.data.user)
    uni.showToast({ title: '账号创建成功', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: redirect.value }), 350)
  } catch {
    await refreshCaptcha()
  } finally {
    submitting.value = false
  }
}

function goBack() { uni.navigateBack({ delta: 1 }) }
</script>

<style lang="scss" scoped>
.screen { min-height: 100vh; padding: 24px 18px 28px; overflow: hidden; background: #f7f0e1; color: #2c2416; font-family: 'Avenir Next', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.page-topbar { display: flex; align-items: center; gap: 10rpx; color: #776a58; font-size: 13px; font-weight: 700; }.back-action { display: flex; width: 56rpx; height: 56rpx; align-items: center; justify-content: center; border-radius: 20rpx; background: #24433b; }
.auth-title { margin: 58px 0 30px; text-align: center; }
.title { display: block; font-family: Georgia, 'Times New Roman', serif; font-size: 30px; line-height: 1.1; font-weight: bold; }
.subtitle { display: block; margin-top: 9px; color: #776a58; font-size: 12px; }
.field { display: grid; gap: 7px; margin-bottom: 13px; color: #606c38; font-size: 12px; font-weight: 800; }
.field-box { display: flex; min-height: 48px; align-items: center; padding: 0 14px; border-radius: 18px; background: rgba(255, 253, 247, 0.82); color: #776a58; box-shadow: inset 0 0 0 1px rgba(96, 108, 56, 0.12); }
.field-box :deep(.u-input) { flex: 1; }
.captcha-row { display: flex; min-width: 0; align-items: center; gap: 10px; }
.captcha-input { min-width: 0; flex: 1; }
.captcha-img { display: flex; width: 110px; height: 44px; flex: 0 0 110px; align-items: center; justify-content: center; overflow: hidden; border: 1px solid #e5dcc8; border-radius: 10px; background: #f0ece0; }
.captcha-image { display: block; width: 100%; height: 100%; border-radius: 10px; }
.captcha-placeholder { color: #b0a494; font-size: 12px; letter-spacing: 2px; }
.primary-action { width: 100%; min-height: 50px; margin-top: 18px; border-radius: 20px; color: #fffdf7; font-size: 15px; font-weight: 900; }
.login-row { display: flex; justify-content: center; gap: 4px; margin-top: 14px; color: #776a58; font-size: 12px; }
.login-link { color: #606c38; font-weight: 800; }
@media (min-width: 600px) { .screen { width: 390px; min-height: 844px; margin: 0 auto; padding-right: 18px; padding-left: 18px; border-radius: 34px; box-shadow: 0 30px 80px rgba(44, 36, 22, 0.18); } }
</style>
