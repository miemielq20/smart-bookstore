<template>
  <div class="login-page">
    <!-- 背景 SVG 书本插图 -->
    <div class="bg-books">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <g stroke="#2d5a3d" stroke-width="1" fill="none" opacity=".2">
          <rect x="80" y="680" width="140" height="12" rx="1" />
          <rect x="85" y="668" width="130" height="12" rx="1" />
          <rect x="82" y="656" width="120" height="12" rx="1" />
          <rect x="90" y="644" width="100" height="12" rx="1" />
          <rect x="1100" y="520" width="180" height="14" rx="1" />
          <rect x="1090" y="506" width="160" height="14" rx="1" />
          <rect x="1095" y="492" width="140" height="14" rx="1" />
          <rect x="1108" y="478" width="120" height="14" rx="1" />
          <rect x="1115" y="464" width="100" height="14" rx="1" />
          <rect x="200" y="200" width="100" height="10" rx="1" />
          <rect x="192" y="190" width="90" height="10" rx="1" />
          <rect x="198" y="180" width="80" height="10" rx="1" />
          <rect x="1250" y="300" width="130" height="12" rx="1" />
          <rect x="1240" y="288" width="120" height="12" rx="1" />
          <rect x="1248" y="276" width="110" height="12" rx="1" />
          <rect x="520" y="750" width="160" height="16" rx="1" />
          <rect x="510" y="734" width="140" height="16" rx="1" />
          <rect x="525" y="718" width="120" height="16" rx="1" />
          <line x1="60" y1="695" x2="240" y2="695" stroke-width="1.5" />
          <line x1="1070" y1="538" x2="1300" y2="538" stroke-width="1.5" />
          <line x1="490" y1="770" x2="700" y2="770" stroke-width="1.5" />
          <rect x="160" y="645" width="10" height="46" rx="1" transform="rotate(15 165 668)" />
          <rect x="1150" y="470" width="10" height="52" rx="1" transform="rotate(-8 1155 496)" />
          <rect x="230" y="185" width="8" height="38" rx="1" transform="rotate(20 234 204)" />
          <circle cx="320" cy="420" r="1.5" />
          <circle cx="760" cy="280" r="1" />
          <circle cx="950" cy="600" r="1.5" />
          <circle cx="180" cy="380" r="1" />
          <circle cx="600" cy="400" r="1.2" />
          <circle cx="1000" cy="200" r="1" />
          <circle cx="400" cy="550" r="1.5" />
        </g>
      </svg>
    </div>

    <!-- 主容器 -->
    <div class="container">
      <!-- 左侧：名言面板 -->
      <div class="left-panel">
        <div class="quote-wrapper">
          <div class="quote-mark">"</div>
          <div class="quote-text">书籍是人类<br />进步的阶梯</div>
          <div class="quote-author">高尔基</div>
        </div>

        <div class="brand-divider"></div>

        <div class="brand-mini">
          <div class="brand-mini-icon">📚</div>
          <div class="brand-mini-name">智慧书城</div>
          <div class="brand-mini-sub">图书管理系统 · 后台</div>
        </div>

        <div class="leaf-border">
          <span>&#10038;</span>
        </div>
      </div>

      <!-- 右侧：登录表单 -->
      <div class="right-panel">
        <h2>管理员登录</h2>
        <p class="greet">欢迎使用智慧书城图书管理系统</p>

        <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleLogin">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="管理员账号 / 手机号"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item prop="captcha">
            <div class="captcha-row">
              <el-input
                v-model="form.captcha"
                placeholder="验证码"
                :prefix-icon="Key"
                size="large"
              />
              <div class="captcha-img">
                <CaptchaImage v-if="!captchaUrl" @click="refreshCaptcha" text="点击获取验证码" />
                <img
                  v-if="captchaUrl"
                  :src="captchaUrl"
                  @click="refreshCaptcha"
                  style="display: block; max-width: 100%; height: auto; cursor: pointer"
                />
              </div>
            </div>
          </el-form-item>

          <div class="extra-row">
            <el-checkbox v-model="form.remember">记住登录状态</el-checkbox>
            <a class="forgot" @click="handleForgotPwd">忘记密码？</a>
          </div>

          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form>

        <div class="register-row">
          还没有管理账号？<a @click="handleRequestAccount">申请开通</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Key } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import CaptchaImage from '@/components/CaptchaImage.vue'
import { loginApi, getCodeApi } from '@/api/api'
import type { LoginParams } from '@/type/api.request'

const router = useRouter()
const loading = ref(false)

/* ==================== 表单数据 ==================== */
const formRef = ref<FormInstance>()
const form = reactive({
  username: '',
  password: '',
  captcha: '',
  remember: true,
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

const captchaUrl = ref('')
const captchaId = ref('')

// 刷新验证码
async function refreshCaptcha() {
  const res = await getCodeApi()
  captchaUrl.value = res.data.img
  captchaId.value = res.data.uuid
}

// 登录
async function handleLogin() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const data: LoginParams = {
      username: form.username,
      password: form.password,
      captcha: form.captcha,
      captchaId: captchaId.value,
    }
    const res = await loginApi(data)
    localStorage.setItem('token', res.data.accessToken)
    ElMessage.success('登录成功')
    router.replace('/')
  } catch {
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}
async function handleForgotPwd() {
  ElMessage.info('忘记密码? 请与管理员联系')
}

onMounted(async () => {})

async function handleRequestAccount() {
  ElMessage.info('请联系管理员申请账号')
}
</script>

<style lang="scss">
/* 全局页面样式（非 scoped — body 纸纹理） */
.login-page body,
.login-page {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: #f2ede4;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow-x: hidden;

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.008) 2px,
      rgba(0, 0, 0, 0.008) 3px
    );
    pointer-events: none;
    z-index: 0;
  }
}
</style>

<style lang="scss" scoped>
/* ==================== 设计变量 ==================== */
$accent-green: #2d5a3d;
$accent-green-hover: #1f422d;
$card-bg: #faf7f1;
$text-primary: #2c2416;
$text-secondary: #7a6e5e;
$text-muted: #b0a494;
$border-light: #e5dcc8;

/* ==================== 页面根容器 ==================== */
.login-page {
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Serif SC', 'Noto Sans SC', serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  box-sizing: border-box;

  /* 背景 SVG 书堆插图 */
  .bg-books {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    opacity: 0.35;

    svg {
      position: absolute;
      width: 100%;
      height: 100%;
    }
  }

  /* ==================== 主容器 ==================== */
  .container {
    position: relative;
    z-index: 1;
    display: flex;
    width: 100%;
    max-width: 900px;
    min-height: 500px;
    background: $card-bg;
    border-radius: 20px;
    box-shadow:
      0 12px 60px rgba(60, 40, 20, 0.08),
      0 0 0 1px rgba(60, 40, 20, 0.04);
    overflow: hidden;
  }

  /* ==================== 左侧绿色面板 ==================== */
  .left-panel {
    width: 320px;
    flex-shrink: 0;
    background: linear-gradient(160deg, #2d5a3d 0%, #3a6b4a 40%, #4a7d5a 100%);
    padding: 52px 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    overflow: hidden;

    /* 木纹纹理叠加 */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        repeating-linear-gradient(
          87deg,
          transparent,
          transparent 3px,
          rgba(0, 0, 0, 0.03) 3px,
          rgba(0, 0, 0, 0.03) 4px
        ),
        repeating-linear-gradient(
          93deg,
          transparent,
          transparent 12px,
          rgba(0, 0, 0, 0.02) 12px,
          rgba(0, 0, 0, 0.02) 13px
        );
      opacity: 0.4;
      pointer-events: none;
    }

    /* 径向光晕 */
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        ellipse at 30% 80%,
        rgba(255, 255, 255, 0.04) 0%,
        transparent 60%
      );
      pointer-events: none;
    }
  }

  /* 名言区域 */
  .quote-wrapper {
    position: relative;
    z-index: 1;
    text-align: center;
  }

  .quote-mark {
    font-size: 64px;
    font-family: 'Georgia', serif;
    color: rgba(255, 255, 255, 0.08);
    line-height: 1;
    margin-bottom: -20px;
    text-align: left;
  }

  .quote-text {
    font-size: 22px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.8;
    letter-spacing: 2px;
    font-family: 'Noto Serif SC', 'SimSun', 'Songti SC', serif;
    margin-bottom: 18px;
  }

  .quote-author {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 3px;

    &::before {
      content: '—— ';
    }
  }

  .brand-divider {
    width: 40px;
    height: 2px;
    background: rgba(255, 255, 255, 0.15);
    margin: 32px auto 24px;
    border-radius: 1px;
  }

  .brand-mini {
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .brand-mini-icon {
    font-size: 36px;
    margin-bottom: 8px;
  }

  .brand-mini-name {
    font-size: 18px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 4px;
  }

  .brand-mini-sub {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.35);
    letter-spacing: 3px;
    margin-top: 4px;
  }

  .leaf-border {
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    text-align: center;
    z-index: 1;
    opacity: 0.12;
    font-size: 16px;
    color: #fff;
  }

  /* ==================== 右侧表单面板 ==================== */
  .right-panel {
    flex: 1;
    padding: 48px 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: $card-bg;
    position: relative;

    h2 {
      font-size: 22px;
      font-weight: 700;
      color: $text-primary;
      margin: 0 0 4px;
    }

    .greet {
      font-size: 13px;
      color: $text-secondary;
      margin: 0 0 28px;
    }

    /* Element Plus 表单统一样式覆盖 */
    :deep(.el-form-item) {
      margin-bottom: 20px;
    }

    :deep(.el-input) {
      --el-input-bg-color: #f8f5ee;
      --el-input-border-color: #{$border-light};
      --el-input-hover-border-color: #{$accent-green};
      --el-input-focus-border-color: #{$accent-green};
      --el-input-border-radius: 10px;
    }

    :deep(.el-input__wrapper) {
      padding: 6px 14px;
      box-shadow: none;
      background: #f8f5ee;
      border: 1px solid $border-light;
      border-radius: 10px;

      &.is-focus {
        box-shadow: 0 0 0 3px rgba(45, 90, 61, 0.06);
        background: #fff;
        border-color: $accent-green;
      }
    }

    :deep(.el-input__prefix) {
      margin-right: 8px;
      color: #7a6e5e;
      opacity: 0.35;
    }

    :deep(.el-input--large .el-input__wrapper) {
      padding: 4px 14px;
    }
  }

  /* ==================== 图形验证码行 ==================== */
  .captcha-row {
    display: flex;
    gap: 10px;
    width: 100%;

    .el-input {
      flex: 1;
    }
  }

  .captcha-img {
    flex-shrink: 0;
    width: 110px;
    height: 44px;
    border-radius: 10px;
    border: 1px solid $border-light;
    background: #f0ece0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    user-select: none;
    transition: border-color 0.2s;

    &:hover {
      border-color: $accent-green;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 10px;
    }
  }

  .captcha-placeholder {
    font-size: 12px;
    color: $text-muted;
    letter-spacing: 2px;
  }

  /* ==================== 附加行（记住密码 + 忘记密码） ==================== */
  .extra-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 26px;
    font-size: 13px;

    :deep(.el-checkbox__label) {
      color: $text-secondary;
      font-size: 13px;
    }

    :deep(.el-checkbox__inner) {
      border-radius: 4px;
    }

    :deep(.is-checked .el-checkbox__inner) {
      background-color: $accent-green;
      border-color: $accent-green;
    }
  }

  .forgot {
    color: $accent-green;
    text-decoration: none;
    cursor: pointer;
    font-size: 13px;

    &:hover {
      text-decoration: underline;
    }
  }

  /* ==================== 登录按钮 ==================== */
  .login-btn {
    width: 100%;
    padding: 13px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 3px;
    border-radius: 10px;
    border: none;

    &,
    &:focus {
      background: $accent-green;
      border-color: $accent-green;
    }

    &:hover,
    &:active {
      background: $accent-green-hover !important;
      border-color: $accent-green-hover !important;
      box-shadow: 0 6px 24px rgba(45, 90, 61, 0.25);
      transform: translateY(-1px);
    }

    &:not(:hover) {
      box-shadow: 0 4px 16px rgba(45, 90, 61, 0.15);
    }
  }

  /* ==================== 申请开通链接 ==================== */
  .register-row {
    text-align: center;
    margin-top: 20px;
    font-size: 13px;
    color: $text-secondary;

    a {
      color: $accent-green;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  /* ==================== 响应式适配 ==================== */
  @media (max-width: 768px) {
    .container {
      flex-direction: column;
      max-width: 420px;
    }

    .left-panel {
      width: 100%;
      padding: 36px 28px;
      min-height: 200px;
    }

    .right-panel {
      padding: 32px 24px;
    }

    .quote-text {
      font-size: 18px;
    }

    .leaf-border {
      display: none;
    }
  }
}

.captcha-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: $accent-green;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1px;
  border-radius: 10px;
  cursor: pointer;
}
</style>
