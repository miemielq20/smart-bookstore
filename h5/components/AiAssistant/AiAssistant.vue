<template>
  <view class="assistant-root">
    <view v-if="opened" class="assistant-panel">
      <view class="assistant-header">
        <view class="assistant-heading">
          <view class="assistant-mark"
            ><u-icon name="star" color="#FFFFFF" size="18"
          /></view>
          <view>
            <text class="assistant-title">AI 选书助手</text>
            <text class="assistant-caption">从书城里找到下一本好书</text>
          </view>
        </view>
        <view class="assistant-actions">
          <view class="header-action" @tap="showHistory = !showHistory">
            <u-icon name="clock" color="#52604A" size="19" />
          </view>
          <view class="header-action" @tap="startNewConversation">
            <u-icon name="plus" color="#52604A" size="20" />
          </view>
          <view class="icon-button" @tap="close">
            <u-icon name="close" color="#52604A" size="20" />
          </view>
        </view>
      </view>

      <view v-if="showHistory" class="history-panel">
        <view class="history-head">
          <text class="history-title">历史对话</text>
          <text class="history-new" @tap="startNewConversation">新对话</text>
        </view>
        <scroll-view v-if="conversations.length" class="history-list" scroll-y>
          <view
            v-for="conversation in conversations"
            :key="conversation.id"
            class="history-item"
            @tap="loadConversation(conversation)"
          >
            <text class="history-item-title">{{ conversation.title }}</text>
            <text class="history-item-time">{{ formatHistoryTime(conversation.updatedAt) }}</text>
          </view>
        </scroll-view>
        <text v-else class="history-empty">还没有历史对话</text>
      </view>

      <scroll-view
        class="message-list"
        scroll-y
        :scroll-into-view="lastMessageId"
      >
        <view v-if="!messages.length" class="empty-state">
          <text class="empty-title">今天想读什么？</text>
          <text class="empty-copy"
            >告诉我作者、题材、阅读场景或预算，我会从在售图书中帮你挑选。</text
          >
        </view>
        <view
          v-for="(message, index) in messages"
          :id="`message-${index}`"
          :key="index"
          class="message-row"
          :class="message.role"
        >
          <view class="message-bubble">{{ message.content }}</view>
          <view
            v-if="message.books?.length && !message.typing"
            class="recommendation-block"
          >
            <view class="recommendation-heading"
              ><text>为你挑选</text
              ><text class="recommendation-count"
                >{{ message.books.length }} 本</text
              ></view
            >
            <view
              v-for="book in message.books"
              :key="book.id"
              class="recommendation"
            >
              <view class="recommendation-main" @tap="openBook(book.id)">
                <view class="recommendation-cover">
                  <image
                    v-if="book.coverUrl"
                    :src="normalizeAssetUrl(book.coverUrl)"
                    mode="aspectFill"
                  />
                  <u-icon v-else name="book" color="#FFFFFF" size="24" />
                </view>
                <view class="recommendation-info">
                  <text class="recommendation-title">{{ book.title }}</text>
                  <text class="recommendation-author">{{
                    book.author || '未知作者'
                  }}</text>
                  <text class="recommendation-description">{{
                    shortDescription(book)
                  }}</text>
                  <text class="recommendation-price"
                    >¥{{ book.price.toFixed(2) }}</text
                  >
                </view>
              </view>
              <view
                class="cart-button"
                :class="{
                  disabled: book.stock < 1 || cartLoadingId === book.id,
                }"
                @tap.stop="addToCart(book)"
              >
                <u-icon
                  name="shopping-cart"
                  color="#FFFFFF"
                  size="16"
                /><text>{{ book.stock < 1 ? '售罄' : '加入购物车' }}</text>
              </view>
            </view>
            <view class="replace-button" @tap="replaceBooks(message)"
              ><u-icon name="reload" color="#606C38" size="16" /><text>{{
                replacing ? '正在换书' : '换一本'
              }}</text></view
            >
          </view>
        </view>
        <view v-if="loading" class="loading-row"
          ><u-loading-icon color="#606C38" size="18" /><text
            >正在查找书城图书</text
          ></view
        >
        <view id="message-bottom"></view>
      </scroll-view>

      <view class="input-row">
        <u-input
          v-model="input"
          class="assistant-input"
          border="none"
          clearable
          maxlength="500"
          placeholder="例如：推荐适合睡前阅读的书"
          @confirm="send"
        />
        <view class="send-button" :class="{ disabled: loading }" @tap="send"
          ><u-icon name="arrow-up" color="#FFFFFF" size="19"
        /></view>
      </view>
    </view>
    <view
      class="assistant-button"
      @tap="opened = !opened"
      ><u-icon :name="opened ? 'close' : 'star'" color="#FFFFFF" size="24"
    /></view>
  </view>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { addCartItemApi } from '../../services/bookstore'
import {
  getAiSessionApi,
  getAiSessionsApi,
  streamAiChat,
  type AiBookRecommendation,
  type AiConversationSummary,
} from '../../services/ai'
import { hasLoginToken } from '../../services/auth'
import { normalizeAssetUrl } from '../../services/assets'

interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
  books?: AiBookRecommendation[]
  typing?: boolean
  query?: string
}

interface Conversation {
  id: string
  title: string
  messages?: AssistantMessage[]
  updatedAt: number
}

const CONVERSATION_STORAGE_KEY = 'ai-conversations'
const CURRENT_SESSION_STORAGE_KEY = 'ai-current-session-id'

const opened = ref(false)
const loading = ref(false)
const replacing = ref(false)
const cartLoadingId = ref<number | null>(null)
const input = ref('')
const messages = ref<AssistantMessage[]>([])
const conversations = ref<Conversation[]>([])
const showHistory = ref(false)
const conversationId = ref('')
const lastMessageId = computed(() => `message-${messages.value.length - 1}`)

onMounted(() => {
  conversations.value = uni.getStorageSync(CONVERSATION_STORAGE_KEY) || []
  const currentSessionId = uni.getStorageSync(CURRENT_SESSION_STORAGE_KEY)
  if (hasLoginToken()) {
    conversationId.value = currentSessionId ? String(currentSessionId) : ''
    refreshConversations()
    if (conversationId.value) restoreCurrentConversation(conversationId.value)
  } else {
    const latest = conversations.value[0]
    if (latest?.messages?.length) {
      conversationId.value = latest.id
      messages.value = latest.messages.map((message) => ({ ...message }))
    } else {
      conversationId.value = createConversationId()
    }
  }
})

onBeforeUnmount(() => {
  saveConversation()
})

async function send() {
  const message = input.value.trim()
  if (!message || loading.value) return
  input.value = ''
  messages.value.push({ role: 'user', content: message })
  await requestRecommendations(message)
}

async function requestRecommendations(
  message: string,
  excludeIds: number[] = [],
) {
  loading.value = true
  const assistant: AssistantMessage = {
    role: 'assistant',
    content: '',
    typing: true,
    query: message,
  }
  messages.value.push(assistant)
  try {
    const response = await streamAiChat(message, excludeIds, (content) => {
      appendReplyByCharacter(assistant, content)
    }, hasLoginToken() ? conversationId.value || undefined : undefined)
    await finishReplyByCharacter(assistant)
    assistant.books = response.books
    assistant.typing = false
    if (response.sessionId) conversationId.value = String(response.sessionId)
    if (response.sessionId) {
      uni.setStorageSync(CURRENT_SESSION_STORAGE_KEY, conversationId.value)
    }
    if (hasLoginToken()) refreshConversations()
    else saveConversation()
  } catch {
    await finishReplyByCharacter(assistant)
    assistant.content = '暂时无法连接助手，请稍后再试。'
    assistant.typing = false
  } finally {
    loading.value = false
    replacing.value = false
  }
}

// 开始新会话前保存当前内容，避免切换会话时丢失已经完成的推荐。
function startNewConversation() {
  if (loading.value) return
  saveConversation()
  messages.value = []
  input.value = ''
  conversationId.value = hasLoginToken() ? '' : createConversationId()
  uni.removeStorageSync(CURRENT_SESSION_STORAGE_KEY)
  showHistory.value = false
}

// 首页重新创建时恢复上一次登录用户正在查看的会话。
async function restoreCurrentConversation(id: string) {
  try {
    const response = await getAiSessionApi(Number(id))
    messages.value = response.data.messages.map((message) => ({
      role: message.role,
      content: message.content,
      books: message.books,
      typing: false,
    }))
  } catch {
    conversationId.value = ''
    uni.removeStorageSync(CURRENT_SESSION_STORAGE_KEY)
  }
}

// 从本地历史记录恢复完整的问答内容。
async function loadConversation(conversation: Conversation) {
  if (loading.value) return
  if (hasLoginToken()) {
    const response = await getAiSessionApi(Number(conversation.id))
    messages.value = response.data.messages.map((message) => ({
      role: message.role,
      content: message.content,
      books: message.books,
      typing: false,
    }))
  } else {
    saveConversation()
    messages.value = (conversation.messages ?? []).map((message) => ({ ...message }))
  }
  conversationId.value = conversation.id
  showHistory.value = false
  opened.value = true
}

function saveConversation() {
  if (!messages.value.length || !conversationId.value) return
  const firstQuestion = messages.value.find((message) => message.role === 'user')
  const item: Conversation = {
    id: conversationId.value,
    title: firstQuestion?.content.slice(0, 24) || '新对话',
    messages: messages.value,
    updatedAt: Date.now(),
  }
  const remaining = conversations.value.filter((conversation) => conversation.id !== item.id)
  conversations.value = [item, ...remaining].slice(0, 20)
  uni.setStorageSync(CONVERSATION_STORAGE_KEY, conversations.value)
}

// 登录后从服务端刷新会话列表，游客则继续使用本地临时记录。
async function refreshConversations() {
  if (!hasLoginToken()) return
  try {
    const response = await getAiSessionsApi()
    conversations.value = response.data.map((item: AiConversationSummary) => ({
      id: String(item.id),
      title: item.title || '新对话',
      updatedAt: new Date(item.updatedAt).getTime(),
    }))
  } catch {
    conversations.value = []
  }
}

function createConversationId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatHistoryTime(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const replyChains = new WeakMap<AssistantMessage, Promise<void>>()

// 将模型流片段拆成字符，按固定短间隔逐字渲染到当前消息。
function appendReplyByCharacter(message: AssistantMessage, content: string) {
  let chain = replyChains.get(message) ?? Promise.resolve()
  for (const character of content) {
    chain = chain.then(async () => {
      message.content += character
      await new Promise((resolve) => setTimeout(resolve, 24))
    })
  }
  replyChains.set(message, chain)
}

// 等待已经收到的字符全部渲染完成，再展示推荐图书。
async function finishReplyByCharacter(message: AssistantMessage) {
  await replyChains.get(message)
}

async function replaceBooks(message: AssistantMessage) {
  if (replacing.value || loading.value || !message.query) return
  replacing.value = true
  await requestRecommendations(
    message.query,
    message.books?.map((book) => book.id) ?? [],
  )
}

async function addToCart(book: AiBookRecommendation) {
  if (book.stock < 1 || cartLoadingId.value === book.id) return
  if (!hasLoginToken()) {
    uni.navigateTo({
      url: `/pages/login/login?redirect=${encodeURIComponent('/pages/cart/cart')}`,
    })
    return
  }
  cartLoadingId.value = book.id
  try {
    await addCartItemApi({ bookId: book.id })
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  } finally {
    cartLoadingId.value = null
  }
}

function shortDescription(book: AiBookRecommendation) {
  const text = book.description || book.reading || '适合日常阅读'
  return text.length > 34 ? `${text.slice(0, 34)}...` : text
}

function openBook(id: number) {
  opened.value = false
  uni.navigateTo({ url: `/pages/book/detail?id=${id}` })
}

function close() {
  opened.value = false
}
</script>

<style lang="scss" scoped>
.assistant-root {
  position: fixed;
  right: 28rpx;
  bottom: calc(138rpx + env(safe-area-inset-bottom));
  z-index: 110;
}
.assistant-button {
  display: flex;
  width: 92rpx;
  height: 92rpx;
  align-items: center;
  justify-content: center;
  border: 6rpx solid rgba(255, 255, 255, 0.78);
  border-radius: 50%;
  background: #606c38;
  box-shadow: 0 12rpx 28rpx rgba(48, 63, 38, 0.26);
}
.assistant-panel {
  position: absolute;
  right: 0;
  bottom: 116rpx;
  display: flex;
  width: min(680rpx, 88vw);
  height: min(960rpx, 72vh);
  flex-direction: column;
  overflow: hidden;
  border: 1rpx solid #e4e8de;
  border-radius: 20rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 50rpx rgba(36, 67, 59, 0.2);
}
.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #f4f6ef;
}
.assistant-actions {
  display: flex;
  align-items: center;
  gap: 4rpx;
}
.header-action,
.icon-button {
  display: flex;
  width: 56rpx;
  height: 56rpx;
  align-items: center;
  justify-content: center;
}
.assistant-heading {
  display: flex;
  align-items: center;
  gap: 14rpx;
}
.assistant-mark {
  display: flex;
  width: 54rpx;
  height: 54rpx;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: #606c38;
}
.assistant-title,
.assistant-caption {
  display: block;
}
.assistant-title {
  color: #26382d;
  font-size: 29rpx;
  font-weight: 800;
}
.assistant-caption {
  margin-top: 5rpx;
  color: #829078;
  font-size: 19rpx;
}
.history-panel {
  padding: 18rpx 24rpx;
  border-bottom: 1rpx solid #e4e8de;
  background: #ffffff;
}
.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.history-title {
  color: #354532;
  font-size: 23rpx;
  font-weight: 800;
}
.history-new {
  color: #606c38;
  font-size: 21rpx;
}
.history-list {
  max-height: 220rpx;
  margin-top: 10rpx;
}
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f0f2ed;
}
.history-item-title {
  overflow: hidden;
  color: #52604a;
  font-size: 21rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-item-time,
.history-empty {
  color: #9aa493;
  font-size: 19rpx;
}
.history-empty {
  display: block;
  padding: 18rpx 0 6rpx;
  text-align: center;
}
.message-list {
  min-height: 0;
  flex: 1;
  padding: 24rpx;
  box-sizing: border-box;
  background: #fbfcfa;
}
.empty-state {
  padding: 92rpx 34rpx 60rpx;
  text-align: center;
}
.empty-title,
.empty-copy {
  display: block;
}
.empty-title {
  color: #354532;
  font-size: 31rpx;
  font-weight: 800;
}
.empty-copy {
  margin-top: 16rpx;
  color: #8a9584;
  font-size: 21rpx;
  line-height: 1.6;
}
.message-row {
  margin-bottom: 22rpx;
}
.message-row.user {
  text-align: right;
}
.message-bubble {
  display: inline-block;
  max-width: 86%;
  padding: 16rpx 18rpx;
  border-radius: 16rpx;
  background: #edf1e9;
  color: #354532;
  font-size: 23rpx;
  line-height: 1.55;
  text-align: left;
}
.message-row.user .message-bubble {
  background: #606c38;
  color: #ffffff;
}
.recommendation-block {
  margin-top: 16rpx;
}
.recommendation-heading {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 10rpx;
  color: #354532;
  font-size: 22rpx;
  font-weight: 800;
}
.recommendation-count {
  color: #9aa493;
  font-size: 19rpx;
  font-weight: 400;
}
.recommendation {
  margin-bottom: 12rpx;
  padding: 14rpx;
  border: 1rpx solid #e4e8de;
  border-radius: 12rpx;
  background: #ffffff;
}
.recommendation-main {
  display: flex;
  gap: 14rpx;
}
.recommendation-cover {
  display: flex;
  width: 84rpx;
  height: 112rpx;
  flex: 0 0 84rpx;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 6rpx;
  background: #aab69c;
}
.recommendation-cover image {
  width: 100%;
  height: 100%;
}
.recommendation-info {
  min-width: 0;
  flex: 1;
}
.recommendation-title,
.recommendation-author,
.recommendation-description,
.recommendation-price {
  display: block;
}
.recommendation-title {
  overflow: hidden;
  color: #26382d;
  font-size: 24rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recommendation-author {
  margin-top: 6rpx;
  color: #829078;
  font-size: 19rpx;
}
.recommendation-description {
  display: -webkit-box;
  margin-top: 8rpx;
  overflow: hidden;
  color: #778273;
  font-size: 19rpx;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.recommendation-price {
  margin-top: 6rpx;
  color: #c66b3d;
  font-size: 22rpx;
  font-weight: 800;
}
.cart-button,
.replace-button {
  display: flex;
  align-items: center;
  justify-content: center;
}
.cart-button {
  gap: 8rpx;
  height: 58rpx;
  margin-top: 12rpx;
  border-radius: 8rpx;
  background: #606c38;
  color: #ffffff;
  font-size: 21rpx;
}
.cart-button.disabled {
  background: #b9c0b3;
}
.replace-button {
  gap: 8rpx;
  height: 64rpx;
  color: #606c38;
  font-size: 21rpx;
}
.loading-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #8a9584;
  font-size: 20rpx;
}
.input-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx 16rpx calc(14rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #e4e8de;
  background: #ffffff;
}
.assistant-input {
  min-width: 0;
  flex: 1;
  padding: 0 14rpx;
  border-radius: 10rpx;
  background: #f4f6ef;
}
.send-button {
  display: flex;
  width: 58rpx;
  height: 58rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #606c38;
}
.send-button.disabled {
  opacity: 0.55;
}
</style>
