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
      ><text class="page-title">AI 选书</text></view
    >
    <view class="hero">
      <text class="title">AI 选书</text>
      <text class="sub">根据阅读偏好、预算和分类推荐图书</text>
    </view>

    <view class="prompt-card">
      <u-textarea
        v-model="prompt"
        placeholder="例如：想找一本轻松但有深度的历史书"
        border="none"
        height="96"
      />
      <u-button color="#606C38" text="生成推荐" @click="toast" />
    </view>

    <view class="quick-row">
      <u-tag
        text="通勤阅读"
        shape="circle"
        bg-color="#606C38"
        border-color="#606C38"
        color="#FFFDF7"
      />
      <u-tag
        text="亲子共读"
        shape="circle"
        plain
        color="#606C38"
        border-color="rgba(96,108,56,.18)"
      />
      <u-tag
        text="管理入门"
        shape="circle"
        plain
        color="#606C38"
        border-color="rgba(96,108,56,.18)"
      />
    </view>

    <u-cell-group
      :border="false"
      custom-style="border-radius: 28rpx; overflow: hidden; background: #FFFDF7;"
    >
      <u-cell
        title="人类群星闪耀时"
        label="历史瞬间、篇幅短、适合碎片时间"
        value="¥39.80"
        :border="false"
      />
      <u-cell title="万历十五年" label="从制度和人物理解历史" value="¥42.00" :border="false" />
    </u-cell-group>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const theme = { page: '#F8F4EA' }
const prompt = ref('')

function toast() {
  uni.showToast({ title: 'AI 会话接口后续接入', icon: 'none' })
}
function goBack() {
  uni.navigateBack({ delta: 1 })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: calc(24rpx + env(safe-area-inset-top)) 28rpx calc(132rpx + env(safe-area-inset-bottom));
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

/* #ifdef MP-WEIXIN */
.page {
  padding-top: calc(132rpx + env(safe-area-inset-top));
}
/* #endif */

.hero {
  margin-bottom: 24rpx;
  padding: 36rpx;
  border-radius: 36rpx;
  background: linear-gradient(118deg, #24433b, #606c38);
}

.title {
  display: block;
  color: #fffdf7;
  font-size: 50rpx;
  font-weight: 900;
}

.sub {
  display: block;
  margin-top: 12rpx;
  color: rgba(255, 253, 247, 0.78);
  font-size: 24rpx;
}

.prompt-card {
  margin-bottom: 20rpx;
  padding: 18rpx;
  border-radius: 28rpx;
  background: #fffdf7;
}

.quick-row {
  display: flex;
  gap: 14rpx;
  margin-bottom: 24rpx;
}
</style>
