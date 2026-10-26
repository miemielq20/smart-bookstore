<template>
  <div class="ai-page">
    <div class="page-title">
      <div>
        <h2>AI 设置</h2>
        <div class="sub">管理图书推荐服务的连接参数与生成策略</div>
      </div>
      <div class="config-state" :class="hasApiKey ? 'is-ready' : 'is-empty'">
        <span class="state-dot"></span>
        <span>{{ hasApiKey ? 'API Key 已配置' : '等待配置 API Key' }}</span>
      </div>
    </div>

    <div class="ai-layout" v-loading="loading">
      <section class="form-panel ai-form-panel">
        <div class="section-heading">
          <div>
            <h3>连接配置</h3>
            <p>保存后，商城端的 AI 推荐会使用这里的运行时配置。</p>
          </div>
          <el-icon class="section-icon"><Connection /></el-icon>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="ai-model">AI 模型</label>
            <input id="ai-model" v-model.trim="form.ai_model" autocomplete="off" placeholder="例如 deepseek-chat" />
            <div class="hint">填写供应商支持的模型名称。</div>
          </div>

          <div class="form-group">
            <label for="ai-key">API Key</label>
            <input
              id="ai-key"
              v-model="form.ai_api_key"
              type="password"
              autocomplete="new-password"
              placeholder="留空则保持现有 Key"
            />
            <div class="hint" v-if="maskedApiKey">
              当前已保存：<code>{{ maskedApiKey }}</code>，输入新值即可替换。
            </div>
            <div class="hint" v-else>当前没有数据库密钥，服务端会继续尝试使用环境变量。</div>
          </div>

          <div class="form-group form-group-wide">
            <label for="ai-base-url">API 地址</label>
            <input
              id="ai-base-url"
              v-model.trim="form.ai_api_base_url"
              type="url"
              autocomplete="url"
              placeholder="https://api.deepseek.com/v1"
            />
            <div class="hint">兼容 OpenAI Chat Completions 接口，保存时不需要补充 `/chat/completions`。</div>
          </div>

          <div class="form-group">
            <label for="ai-temperature">生成温度</label>
            <div class="input-with-suffix">
              <input
                id="ai-temperature"
                v-model.number="form.ai_temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                inputmode="decimal"
              />
              <span>0–2</span>
            </div>
            <div class="hint">数值越高，回复的变化越多。</div>
          </div>

          <div class="form-group">
            <label for="ai-max-tokens">最大输出 Token</label>
            <div class="input-with-suffix">
              <input
                id="ai-max-tokens"
                v-model.number="form.ai_max_tokens"
                type="number"
                min="1"
                max="32768"
                step="1"
                inputmode="numeric"
              />
              <span>tokens</span>
            </div>
            <div class="hint">控制每次推荐回复的最大长度。</div>
          </div>
        </div>

        <div class="form-group prompt-group">
          <label for="ai-prompt">提示词模板</label>
          <textarea
            id="ai-prompt"
            v-model="form.ai_prompt_template"
            rows="5"
            maxlength="5000"
            placeholder="输入推荐助手的角色和回答要求"
          ></textarea>
          <div class="hint prompt-hint">
            <span>系统会在此模板后补充候选图书和用户问题，限制推荐结果来自数据库。</span>
            <span>{{ form.ai_prompt_template.length }}/5000</span>
          </div>
        </div>

        <div class="form-actions">
          <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
          <el-button plain :loading="testing" @click="testConnection">
            <el-icon><Connection /></el-icon>
            测试连接
          </el-button>
          <span v-if="savedAt" class="saved-note">最近保存 {{ savedAt }}</span>
        </div>
      </section>

      <aside class="status-panel">
        <div class="status-card status-card-primary">
          <div class="status-card-topline">
            <span class="eyebrow">CONNECTION</span>
            <el-icon><Lock /></el-icon>
          </div>
          <h3>{{ hasApiKey ? '配置已就绪' : '还未连接' }}</h3>
          <p>
            {{
              hasApiKey
                ? '保存配置后可以测试供应商连接，商城端会实时读取最新参数。'
                : '填写 API Key 并保存后，再测试 AI 服务连接。'
            }}
          </p>
          <div class="status-meta">
            <span>模型</span>
            <strong>{{ form.ai_model || '未设置' }}</strong>
          </div>
        </div>

        <div v-if="testResult" class="status-card test-card" :class="testResult.success ? 'is-success' : 'is-failed'">
          <div class="status-card-topline">
            <span class="eyebrow">LAST TEST</span>
            <el-icon v-if="testResult.success"><CircleCheckFilled /></el-icon>
            <el-icon v-else><WarningFilled /></el-icon>
          </div>
          <h3>{{ testResult.success ? '连接成功' : '连接失败' }}</h3>
          <p>{{ testResult.response }}</p>
          <div class="status-meta">
            <span>响应时间</span>
            <strong>{{ testResult.latency_ms }} ms</strong>
          </div>
        </div>

        <div v-else class="status-card status-card-guide">
          <div class="status-card-topline">
            <span class="eyebrow">QUICK GUIDE</span>
            <el-icon><InfoFilled /></el-icon>
          </div>
          <h3>先保存，再测试</h3>
          <p>测试连接会使用当前已保存的配置，避免未保存的输入影响线上推荐。</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CircleCheckFilled,
  Connection,
  InfoFilled,
  Lock,
  WarningFilled,
} from '@element-plus/icons-vue'
import { getAiConfigApi, testAiConnectionApi, updateAiConfigApi } from '@/api/api'
import type { AiConfig, AiConfigUpdate, AiTestResult } from '@/type/ai'

const defaultForm: AiConfigUpdate = {
  ai_model: '',
  ai_api_key: '',
  ai_api_base_url: '',
  ai_temperature: 0.7,
  ai_max_tokens: 2048,
  ai_prompt_template: '',
}

const form = reactive<AiConfigUpdate>({ ...defaultForm })
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const hasApiKey = ref(false)
const maskedApiKey = ref('')
const savedAt = ref('')
const testResult = ref<AiTestResult | null>(null)

function applyConfig(config: AiConfig) {
  form.ai_model = config.ai_model
  form.ai_api_base_url = config.ai_api_base_url
  form.ai_temperature = config.ai_temperature
  form.ai_max_tokens = config.ai_max_tokens
  form.ai_prompt_template = config.ai_prompt_template
  form.ai_api_key = ''
  hasApiKey.value = config.hasApiKey
  maskedApiKey.value = config.ai_api_key
}

async function loadConfig() {
  loading.value = true
  try {
    const response = await getAiConfigApi()
    applyConfig(response.data)
  } catch {
    ElMessage.error('AI 配置加载失败，请检查服务是否可用')
  } finally {
    loading.value = false
  }
}

function validateForm() {
  if (!form.ai_model.trim()) {
    ElMessage.warning('请输入 AI 模型名称')
    return false
  }
  if (!form.ai_api_base_url.trim()) {
    ElMessage.warning('请输入 API 地址')
    return false
  }
  if (!/^https?:\/\//i.test(form.ai_api_base_url.trim())) {
    ElMessage.warning('API 地址需要以 http:// 或 https:// 开头')
    return false
  }
  if (!Number.isFinite(form.ai_temperature) || form.ai_temperature < 0 || form.ai_temperature > 2) {
    ElMessage.warning('生成温度需要在 0 到 2 之间')
    return false
  }
  if (!Number.isInteger(form.ai_max_tokens) || form.ai_max_tokens < 1 || form.ai_max_tokens > 32768) {
    ElMessage.warning('最大输出 Token 需要在 1 到 32768 之间')
    return false
  }
  if (!form.ai_prompt_template.trim()) {
    ElMessage.warning('请输入提示词模板')
    return false
  }
  return true
}

async function saveConfig() {
  if (!validateForm()) return
  saving.value = true
  try {
    const response = await updateAiConfigApi({
      ...form,
      ai_api_key: form.ai_api_key.trim(),
      ai_api_base_url: form.ai_api_base_url.trim(),
      ai_prompt_template: form.ai_prompt_template.trim(),
    })
    applyConfig(response.data)
    savedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    testResult.value = null
    ElMessage.success('AI 配置已保存')
  } catch {
    ElMessage.error('AI 配置保存失败')
  } finally {
    saving.value = false
  }
}

async function testConnection() {
  testing.value = true
  try {
    const response = await testAiConnectionApi()
    testResult.value = response.data
    if (response.data.success) ElMessage.success('AI 连接测试成功')
    else ElMessage.warning(response.data.response)
  } catch {
    testResult.value = null
    ElMessage.error('连接测试请求失败')
  } finally {
    testing.value = false
  }
}

onMounted(loadConfig)
</script>

<style lang="scss" scoped>
.ai-page {
  --ai-ink: #2c2416;
  --ai-muted: #7a6e5e;
  --ai-soft: #b0a494;
  --ai-border: #e5dcc8;
  --ai-border-light: #efe9dc;
  --ai-card: #faf7f1;
  --ai-sage: #2d5a3d;
  --ai-sage-light: rgba(45, 90, 61, 0.08);
  --ai-clay: #b86c48;
}

.config-state {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--ai-border);
  border-radius: 999px;
  background: rgba(250, 247, 241, 0.72);
  color: var(--ai-muted);
  font-size: 12px;

  .state-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ai-soft);
  }

  &.is-ready {
    color: var(--ai-sage);
    .state-dot {
      background: #5a8f6a;
      box-shadow: 0 0 0 4px rgba(90, 143, 106, 0.14);
    }
  }
}

.ai-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(250px, 0.8fr);
  gap: 18px;
  align-items: start;
}

.ai-form-panel {
  width: auto;
  max-width: none;
  padding: 26px 28px 24px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--ai-border-light);
  margin-bottom: 22px;

  h3 {
    margin: 0;
    color: var(--ai-ink);
    font-size: 17px;
  }

  p {
    margin: 6px 0 0;
    color: var(--ai-muted);
    font-size: 12px;
    line-height: 1.6;
  }

  .section-icon {
    color: var(--ai-sage);
    font-size: 20px;
    padding: 8px;
    border-radius: 10px;
    background: var(--ai-sage-light);
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.form-group-wide,
.prompt-group {
  grid-column: 1 / -1;
}

.form-group {
  margin-bottom: 19px;

  label {
    display: block;
    margin-bottom: 7px;
    color: var(--ai-ink);
    font-size: 13px;
    font-weight: 600;
  }

  input,
  textarea {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid var(--ai-border);
    border-radius: 9px;
    outline: none;
    background: #fffdf9;
    color: var(--ai-ink);
    font: inherit;
    font-size: 13px;
    transition: border-color 160ms ease, box-shadow 160ms ease;

    &:focus {
      border-color: #5a8f6a;
      box-shadow: 0 0 0 3px rgba(90, 143, 106, 0.12);
    }

    &::placeholder {
      color: #b9ae9e;
    }
  }

  input {
    height: 40px;
    padding: 0 12px;
  }

  textarea {
    min-height: 112px;
    padding: 11px 12px;
    line-height: 1.7;
    resize: vertical;
  }

  .hint {
    margin-top: 6px;
    color: var(--ai-soft);
    font-size: 11px;
    line-height: 1.5;

    code {
      color: var(--ai-sage);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
  }
}

.input-with-suffix {
  position: relative;

  input {
    padding-right: 58px;
  }

  span {
    position: absolute;
    top: 50%;
    right: 12px;
    color: var(--ai-soft);
    font-size: 11px;
    transform: translateY(-50%);
    pointer-events: none;
  }
}

.prompt-hint {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;

  :deep(.el-button) {
    height: 38px;
    border-radius: 8px;
    padding: 0 16px;
  }

  :deep(.el-button--primary) {
    border-color: var(--ai-sage);
    background: var(--ai-sage);
  }

  .saved-note {
    margin-left: 4px;
    color: var(--ai-soft);
    font-size: 11px;
  }
}

.status-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status-card {
  position: relative;
  overflow: hidden;
  padding: 20px;
  border: 1px solid var(--ai-border-light);
  border-radius: 14px;
  background: var(--ai-card);

  &::after {
    position: absolute;
    right: -26px;
    bottom: -32px;
    width: 110px;
    height: 110px;
    border: 1px solid rgba(45, 90, 61, 0.1);
    border-radius: 50%;
    content: '';
  }

  h3 {
    margin: 16px 0 7px;
    color: var(--ai-ink);
    font-size: 17px;
  }

  p {
    position: relative;
    z-index: 1;
    margin: 0;
    color: var(--ai-muted);
    font-size: 12px;
    line-height: 1.7;
  }
}

.status-card-primary {
  background: linear-gradient(145deg, #edf2e8 0%, #f9f4ea 72%);
  border-color: #dbe5d5;
}

.status-card-guide {
  background: #f5eee3;
}

.status-card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--ai-sage);
  font-size: 17px;

  .eyebrow {
    color: var(--ai-soft);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.4px;
  }
}

.status-meta {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid rgba(45, 90, 61, 0.12);
  color: var(--ai-muted);
  font-size: 11px;

  strong {
    max-width: 66%;
    overflow: hidden;
    color: var(--ai-ink);
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.test-card {
  &.is-success {
    border-color: #cde2d0;
    .status-card-topline {
      color: #34804a;
    }
  }

  &.is-failed {
    border-color: #ead4c7;
    .status-card-topline {
      color: var(--ai-clay);
    }
  }
}

@media (max-width: 900px) {
  .ai-layout {
    grid-template-columns: 1fr;
  }

  .status-panel {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page-title {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .ai-form-panel {
    padding: 20px 16px;
  }

  .form-grid,
  .status-panel {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-wrap: wrap;
  }

  .prompt-hint {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
