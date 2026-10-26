<template>
  <view class="screen">
    <u-navbar
      title=""
      bg-color="#F7F0E1"
      :border="false"
      :placeholder="true"
      :safe-area-inset-top="true"
    />

    <!-- 使用用户图标作为登录页标识，替换原来的抽象图形。 -->
    <view class="login-mark">
      <view class="login-mark-inner">
        <u-icon name="account" color="#FFFDF7" size="43" />
      </view>
    </view>
    <view class="auth-title">
      <text class="title">欢迎回到书城</text>
      <text class="subtitle">手机号、用户名或邮箱登录</text>
    </view>

    <view class="field">
      <text>账号</text>
      <view class="field-box">
        <!-- 账号输入框使用用户图标，替代原来的空白占位区域。 -->
        <u-icon name="account" color="#A0927F" size="20" />
        <u-input v-model="form.username" placeholder="reader@example.com" border="none" clearable />
      </view>
    </view>

    <view class="field">
      <text>密码</text>
      <view class="field-box">
        <u-icon name="lock" color="#A0927F" size="20" />
        <u-input
          v-model="form.password"
          type="password"
          placeholder="输入登录密码"
          border="none"
          clearable
        />
      </view>
    </view>

    <view class="field captcha-field">
      <text>验证码</text>
      <view class="captcha-row">
        <view class="field-box captcha-input">
          <u-icon name="more-circle" color="#A0927F" size="20" />
          <u-input v-model="form.captcha" placeholder="输入验证码" border="none" maxlength="4" />
        </view>
        <view class="captcha-img" @tap="refreshCaptcha">
          <image v-if="captcha.img" class="captcha-image" :src="captcha.img" mode="aspectFill" />
          <text v-else class="captcha-placeholder">点击获取验证码</text>
        </view>
      </view>
    </view>

    <u-button
      class="primary-action"
      color="#24433B"
      :loading="submitting"
      text="登录"
      @click="submit"
    />

    <view class="text-link-row">
      <text @tap="showSmsTip">短信验证码登录</text>
      <text @tap="showRegisterTip">创建账号</text>
    </view>

    <view class="test-accounts">
      <text class="test-accounts-label">已有测试账号</text>
      <view class="test-account" @tap="fillTestAccount">
        <u-icon name="account" color="#606C38" size="18" />
        <text>miemie</text>
        <text class="test-account-password">密码 123456</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { reactive, ref } from 'vue'
import { getCaptchaApi, getProfileApi, loginApi } from '../../services/auth'

const form = reactive({ username: '', password: '', captcha: '', captchaId: '' })
const captcha = reactive({ uuid: '', img: '' })
const submitting = ref(false)
const redirect = ref('/pages/index/index')

// 点击测试账号仅填入用户名，避免在登录页展示或预填用户密码。
function fillTestAccount() {
  form.username = 'miemie'
  form.password = '123456'
}

onLoad((options = {}) => {
  const query = options as Record<string, string | undefined>
  redirect.value = query.redirect
    ? decodeURIComponent(query.redirect)
    : '/pages/index/index'
  refreshCaptcha()
})

// 获取新的图形验证码，并同步验证码标识。
async function refreshCaptcha() {
  try {
    const res = await getCaptchaApi()
    captcha.uuid = res.data.uuid
    captcha.img = res.data.img
    form.captchaId = res.data.uuid
    form.captcha = ''
  } catch {
    captcha.uuid = ''
    captcha.img = ''
    form.captchaId = ''
  }
}

// 校验登录信息，保存登录凭证并跳转到目标页面。
async function submit() {
  if (!form.username || !form.password || !form.captcha || !form.captchaId) {
    uni.showToast({ title: '请填写完整登录信息', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const res = await loginApi({ ...form })
    uni.setStorageSync('token', res.data.accessToken)
    // 登录后重新读取商城用户资料，确保头像和背景图使用数据库中的长期 URL。
    let user = res.data.user
    if (user.accountType === 'user') {
      try {
        user = { ...user, ...(await getProfileApi()).data }
      } catch {
        /* 资料读取失败时仍保留基础登录信息 */
      }
    }
    uni.setStorageSync('user', user)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: redirect.value }), 350)
  } catch {
    await refreshCaptcha()
  } finally {
    submitting.value = false
  }
}

// 提示用户短信验证码登录功能的开放状态。
function showSmsTip() {
  uni.showToast({ title: '短信验证码登录即将开放', icon: 'none' })
}
// 跳转到注册页，并保留登录前的目标页面。
function showRegisterTip() {
  uni.navigateTo({ url: `/pages/register/register?redirect=${encodeURIComponent(redirect.value)}` })
}
function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
    return
  }
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.screen {
  min-height: 100vh;
  padding: 18px 18px 34px;
  overflow: hidden;
  background: #f7f0e1;
  color: #2c2416;
  font-family: 'Avenir Next', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  color: #776a58;
  font-size: 13px;
  font-weight: 700;
}

.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 20px;
  margin-bottom: 18px;
  font-size: 12px;
  font-weight: 800;
}

.signal {
  display: flex;
  gap: 5px;
  align-items: center;
}

.signal text {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #2c2416;
}

.login-mark {
  display: flex;
  width: 78px;
  height: 78px;
  margin: 20px auto 18px;
  align-items: center;
  justify-content: center;
  border-radius: 26px;
  background: linear-gradient(145deg, #74864c, #526438);
  box-shadow:
    inset -8px -8px rgba(44, 66, 50, 0.18),
    0 18px 36px rgba(44, 36, 22, 0.16);
}

.login-mark-inner {
  display: flex;
  width: 55px;
  height: 55px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 253, 247, 0.3);
  border-radius: 19px;
  background: rgba(255, 253, 247, 0.1);
}

.auth-title {
  margin: 0 0 26px;
  text-align: center;
}

.title {
  display: block;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 32px;
  line-height: 1.08;
  font-weight: bold;
}

.subtitle {
  display: block;
  margin-top: 8px;
  color: #776a58;
  font-size: 12px;
}

.field {
  display: grid;
  gap: 7px;
  margin-bottom: 13px;
  color: #606c38;
  font-size: 12px;
  font-weight: 800;
}

.field-box {
  display: flex;
  min-height: 48px;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid rgba(96, 108, 56, 0.1);
  border-radius: 16px;
  background: rgba(255, 253, 247, 0.82);
  color: #776a58;
  box-shadow: 0 8px 20px rgba(96, 108, 56, 0.05);
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.field-box:focus-within {
  border-color: rgba(96, 108, 56, 0.42);
  background: #fffdf7;
  box-shadow: 0 8px 22px rgba(96, 108, 56, 0.1);
}

.field-box :deep(.u-input) {
  flex: 1;
}

.captcha-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.captcha-input {
  min-width: 0;
  flex: 1;
}

.captcha-img {
  display: flex;
  width: 110px;
  height: 44px;
  flex: 0 0 110px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #e5dcc8;
  border-radius: 10px;
  background: #f0ece0;
}

.captcha-image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
}

.captcha-placeholder {
  color: #b0a494;
  font-size: 12px;
  letter-spacing: 2px;
}

.primary-action {
  width: 100%;
  min-height: 50px;
  margin-top: 22px;
  border-radius: 16px;
  color: #fffdf7;
  font-size: 15px;
  font-weight: 900;
  box-shadow: 0 10px 20px rgba(36, 67, 59, 0.16);
}

.text-link-row {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
  color: #776a58;
  font-size: 12px;
  font-weight: 700;
}

.test-accounts {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid rgba(96, 108, 56, 0.12);
}

.test-accounts-label {
  color: #9b8d79;
  font-size: 11px;
}

.test-account {
  display: flex;
  min-width: 112px;
  min-height: 44px;
  flex-wrap: wrap;
  align-content: center;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid rgba(96, 108, 56, 0.18);
  border-radius: 18px;
  background: #fffdf7;
  color: #606c38;
  font-size: 12px;
  font-weight: 700;
}

.test-account-password {
  width: 100%;
  color: #9b8d79;
  font-size: 10px;
  font-weight: 400;
  text-align: center;
}

.auth-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 38px;
  color: #9b8d79;
  font-size: 11px;
}

.footer-rule {
  width: 34px;
  height: 1px;
  background: #d8cbb7;
}

.step-list {
  display: grid;
  gap: 10px;
  margin-top: 34px;
}

.step {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 10px;
  align-items: start;
}

.step > text {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 12px;
  background: #e8dcc7;
  color: #606c38;
  font-size: 12px;
  font-weight: 900;
}

.step view text {
  display: block;
}

.step view text:first-child {
  margin: 2px 0 4px;
  color: #2c2416;
  font-size: 13px;
  font-weight: 900;
}

.step view text:last-child {
  color: #776a58;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.45;
}

@media (min-width: 600px) {
  .screen {
    width: 390px;
    min-height: 844px;
    margin: 0 auto;
    padding-right: 18px;
    padding-left: 18px;
    border-radius: 34px;
    box-shadow: 0 30px 80px rgba(44, 36, 22, 0.18);
  }
}
</style>
