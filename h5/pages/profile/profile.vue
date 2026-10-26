<template>
  <view class="page">
    <view class="profile-hero" :style="getBackgroundStyle(form.backgroundImage)">
      <view class="hero-mask"></view>
      <view class="hero-bottom-blur"></view>
      <view class="hero-topbar">
        <view class="back-action" @tap="goBack">
          <u-icon name="arrow-left" color="#FFFFFF" size="24" />
        </view>
        <view class="cover-action" @tap="chooseBackground">
          <u-icon name="camera" color="#FFFFFF" size="22" />
          <text>更换封面</text>
        </view>
      </view>
    </view>

    <view class="profile-summary">
      <view class="avatar-wrap" @tap="chooseAvatar">
        <image
          v-if="form.avatar"
          class="avatar-image"
          :src="normalizeAssetUrl(form.avatar)"
          mode="aspectFill"
        />
        <view v-else class="avatar-placeholder">
          <u-icon name="account" color="#FFFFFF" size="46" />
        </view>
        <view class="avatar-overlay">
          <u-icon name="camera" color="#FFFFFF" size="48" />
          <text>更换头像</text>
        </view>
      </view>
      <view class="profile-name">{{ form.nickname || form.username || '未登录' }}</view>
      <view class="profile-account">账号：{{ form.username || '暂无账号' }}</view>
    </view>

    <view class="profile-list">
      <view class="profile-row" @tap="editNickname">
        <text class="row-label">昵称</text>
        <text class="row-value" :class="{ muted: !form.nickname }">
          {{ form.nickname || '请输入昵称' }}
        </text>
        <u-icon name="arrow-right" color="#999999" size="22" />
      </view>
      <view class="profile-row" @tap="editPhone">
        <text class="row-label">手机号</text>
        <text class="row-value" :class="{ muted: !form.phone }">
          {{ form.phone || '暂未设置' }}
        </text>
        <u-icon name="arrow-right" color="#999999" size="22" />
      </view>
      <view class="profile-row" @tap="editEmail">
        <text class="row-label">邮箱</text>
        <text class="row-value" :class="{ muted: !form.email }">
          {{ form.email || '暂未设置' }}
        </text>
        <u-icon name="arrow-right" color="#999999" size="22" />
      </view>
      <view class="profile-row readonly-row">
        <text class="row-label">用户名</text>
        <text class="row-value muted">{{ form.username || '暂无账号' }}</text>
      </view>
    </view>

    <u-button
      class="save-button"
      color="#24433B"
      text="保存资料"
      :loading="saving"
      @click="save"
    />
  </view>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getProfileApi, updateProfileApi, uploadProfileImageApi } from '../../services/auth'
import { normalizeAssetUrl } from '../../services/assets'

const saving = ref(false)
const form = reactive({
  username: '',
  nickname: '',
  phone: '',
  email: '',
  avatar: '',
  backgroundImage: '',
})

onShow(async () => {
  // 进入页面先读取缓存，再请求最新资料，保证页面打开时有内容可展示。
  Object.assign(form, uni.getStorageSync('user') || {})
  if (!uni.getStorageSync('token')) return
  try {
    Object.assign(form, (await getProfileApi()).data)
  } catch {
    /* 请求层统一提示错误 */
  }
})

function goBack() {
  uni.navigateBack({ delta: 1 })
}

function getBackgroundStyle(url: string) {
  const imageUrl = normalizeAssetUrl(url)
  return imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}
}

function chooseImage(onSuccess: (path: string) => void) {
  // 选择图片后立即上传，保存到资料表的是服务器 URL，不会因重新登录失效。
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (result) => {
      const path = result.tempFilePaths?.[0]
      if (path) uploadImage(path, onSuccess)
    },
  })
}

async function uploadImage(path: string, onSuccess: (url: string) => void) {
  try {
    const result = await uploadProfileImageApi(path)
    onSuccess(result.data.url)
    uni.showToast({ title: '图片上传成功', icon: 'success' })
  } catch {
    uni.showToast({ title: '图片上传失败', icon: 'none' })
  }
}

function chooseAvatar() {
  chooseImage((path) => {
    form.avatar = path
  })
}

function chooseBackground() {
  chooseImage((path) => {
    form.backgroundImage = path
  })
}

function editNickname() {
  uni.showModal({
    title: '修改昵称',
    editable: true,
    content: form.nickname,
    success: (result) => {
      if (result.confirm) form.nickname = result.content || ''
    },
  })
}

function editPhone() {
  uni.showModal({
    title: '修改手机号',
    editable: true,
    content: form.phone,
    success: (result) => {
      if (result.confirm) form.phone = result.content || ''
    },
  })
}

function editEmail() {
  uni.showModal({
    title: '修改邮箱',
    editable: true,
    content: form.email,
    success: (result) => {
      if (result.confirm) form.email = result.content || ''
    },
  })
}

async function save() {
  if (!uni.getStorageSync('token')) {
    uni.navigateTo({ url: '/pages/login/login?redirect=/pages/profile/profile' })
    return
  }
  saving.value = true
  try {
    // 保存资料并同步缓存，让“我的”页面立即显示最新头像和昵称。
    const res = await updateProfileApi({
      nickname: form.nickname,
      phone: form.phone,
      email: form.email,
      avatar: form.avatar,
      backgroundImage: form.backgroundImage,
    })
    Object.assign(form, res.data)
    uni.setStorageSync('user', { ...uni.getStorageSync('user'), ...res.data })
    uni.showToast({ title: '资料已保存', icon: 'success' })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #ffffff;
  color: #222222;
}

.profile-hero {
  position: relative;
  width: 100%;
  height: 24vh;
  background-color: #70866f;
  background-position: center;
  background-size: cover;
}

.hero-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
}

.hero-bottom-blur {
  position: absolute;
  right: 0;
  bottom: -24rpx;
  left: 0;
  height: 90rpx;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.82)
  );
  filter: blur(12rpx);
}

.hero-topbar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(28rpx + env(safe-area-inset-top)) 32rpx 0;
}

.back-action,
.cover-action {
  display: flex;
  align-items: center;
  color: #ffffff;
}

.back-action {
  width: 48rpx;
  height: 48rpx;
  justify-content: flex-start;
}

.cover-action {
  gap: 10rpx;
  font-size: 30rpx;
  text-shadow: 0 1rpx 5rpx rgba(0, 0, 0, 0.25);
}

.profile-summary {
  position: relative;
  min-height: 240rpx;
  padding: 124rpx 32rpx 30rpx;
  text-align: center;
  background: #ffffff;
  border-radius: 28rpx 28rpx 0 0;
  box-shadow: 0 -12rpx 30rpx rgba(0, 0, 0, 0.08);
}

.avatar-wrap {
  position: absolute;
  top: -154rpx;
  left: 50%;
  width: 286rpx;
  height: 286rpx;
  overflow: hidden;
  transform: translateX(-50%);
  border: 8rpx solid #ffffff;
  border-radius: 50%;
  background: #24433b;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
}

.avatar-image,
.avatar-placeholder {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #24433b;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: rgba(0, 0, 0, 0.38);
  color: #ffffff;
  font-size: 28rpx;
}

.profile-name {
  font-size: 42rpx;
  font-weight: 700;
}

.profile-account {
  margin-top: 10rpx;
  color: #999999;
  font-size: 24rpx;
}

.profile-list {
  padding: 0 32rpx;
  background: #ffffff;
}

.profile-row {
  display: flex;
  min-height: 116rpx;
  align-items: center;
  border-bottom: 1rpx solid #f1f1f1;
}

.row-label {
  width: 180rpx;
  flex: 0 0 180rpx;
  color: #777777;
  font-size: 30rpx;
}

.row-value {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #222222;
  font-size: 30rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-value.muted {
  color: #b8b8b8;
  font-weight: 400;
}

.readonly-row {
  border-bottom: 0;
}

.save-button {
  margin: 42rpx 32rpx 70rpx;
  border-radius: 10rpx;
}
</style>
