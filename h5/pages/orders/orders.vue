<template>
  <view class="page">
    <u-navbar
      title=""
      :bg-color="theme.page"
      :border="false"
      :placeholder="true"
      :safe-area-inset-top="true"
    />
    <view class="topline">
      <view class="back" hover-class="tap-soft" @tap="back">
        <u-icon name="arrow-left" color="#FFFDF7" size="21" />
      </view>
      <view class="title-block">
        <text class="title">我的订单</text>
        <text class="sub">全部订单</text>
      </view>
      <view
        class="filter-action"
        :class="{ active: searchVisible }"
        hover-class="tap-soft"
        @tap="toggleSearch"
      >
        <u-icon name="search" color="#FFFDF7" size="22" />
      </view>
    </view>
    <view v-if="searchVisible" class="search-panel">
      <u-search
        v-model="keyword"
        placeholder="订单号 / 图书名称 / 物流单号"
        :show-action="true"
        action-text="查找"
        bg-color="#FFFDF7"
        border-color="rgba(96,108,56,.16)"
        height="46"
        @search="handleSearch"
        @custom="handleSearch"
      />
      <text v-if="keyword" class="search-result">找到 {{ filteredOrders.length }} 条订单</text>
    </view>
    <scroll-view class="tabs" scroll-x show-scrollbar="false">
      <view class="tabs-track">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          class="tab"
          :class="{ active: status === tab.key }"
          @tap="select(tab.key)"
        >{{ tab.label }}</view>
      </view>
    </scroll-view>
    <view v-if="loading" class="loading">
      <u-loading-icon color="#606C38" />
    </view>
    <view v-else-if="loadError" class="load-error">
      <u-icon name="reload" color="#C66B3D" size="28" />
      <text>订单加载失败</text>
      <u-button size="mini" color="#C66B3D" text="重新加载" @click="load" />
    </view>
    <u-empty
      v-else-if="!filteredOrders.length"
      mode="list"
      :text="keyword ? '未找到相关订单' : '暂无订单'"
      margin-top="140"
    />
    <view v-else class="order-list">
      <view
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
        @tap="goDetail(order.id)"
      >
        <view class="order-head">
          <text>{{ order.orderNo }}</text>
          <text class="status">{{ statusText(order.status) }}</text>
        </view>
        <view v-if="order.items.length" class="line">
          <view
            class="cover"
            :style="coverStyle(order.items[0].book.coverUrl)"
          ></view>
          <view class="line-copy">
            <text>{{ order.items[0].book.title || '图书商品' }}</text>
            <text>共 {{ totalItemCount(order) }} 件</text>
          </view>
          <text class="amount">¥{{ order.totalAmount.toFixed(2) }}</text>
        </view>
        <view class="order-actions">
          <template v-if="order.status === 'PENDING'">
            <u-button
              size="mini"
              color="#E8DCC7"
              text="取消订单"
              @tap.stop="remove(order.id)"
            />
            <u-button
              size="mini"
              color="#C66B3D"
              text="立即支付"
              @tap.stop="goPayment(order.id)"
            />
          </template>
          <template v-else-if="order.status === 'PAID'">
            <u-button
              size="mini"
              color="#24433B"
              text="提醒发货"
              @tap.stop="remindShipment"
            />
            <u-button
              size="mini"
              color="#C66B3D"
              text="申请退款"
              @tap.stop="goRefund(order.id)"
            />
          </template>
          <template v-else-if="order.status === 'SHIPPED'">
            <u-button
              size="mini"
              color="red"
              text="申请售后"
              @tap.stop="goAfterSale(order.id)"
            />
            <u-button
              size="mini"
              color="#24433B"
              text="确认收货"
              @tap.stop="complete(order.id)"
            />
          </template>
          <template v-else-if="order.status === 'COMPLETED'">
            <u-button
              size="mini"
              color="#9F9381"
              text="删除订单"
              @tap.stop="remove(order.id)"
            />
          </template>
        </view>
      </view>
    </view>
  </view>
</template>
<script lang="ts" setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, onBeforeUnmount, ref } from 'vue'
import { completeOrderApi, deleteOrderApi, getOrdersApi } from '../../services/bookstore'
import { normalizeAssetUrl } from '../../services/assets'
import { connectOrderRealtime } from '../../services/order-realtime'
import type { Order, OrderStatus } from '../../types/order'
const theme = { page: '#F8F4EA' }
const orders = ref<Order[]>([])
const loading = ref(true)
const loadError = ref(false)
const status = ref<OrderStatus | ''>('')
const keyword = ref('')
const searchVisible = ref(false)
let close = () => undefined
let loadingTask: Promise<void> | null = null
const tabs = [
  { key: '', label: '全部' },
  { key: 'PENDING', label: '待付款' },
  { key: 'PAID', label: '待发货' },
  { key: 'SHIPPED', label: '待收货' },
  { key: 'AFTER_SALE', label: '售后中' },
  { key: 'REFUNDING', label: '退款中' },
] as { key: OrderStatus | ''; label: string }[]

const filteredOrders = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) return orders.value

  return orders.value.filter((order) => {
    const bookText = order.items.map((item) => item.book.title || '').join(' ')
    const trackingText = order.trackingNo || ''
    return [order.orderNo, bookText, trackingText].some((text) =>
      text.toLowerCase().includes(value),
    )
  })
})

onLoad((options) => {
  // 首次进入订单页默认查询全部订单；非法或历史遗留的对象参数也统一回退到全部。
  const queryStatus = typeof (options as any)?.status === 'string' ? (options as any).status : ''
  const validStatuses = tabs.map((tab) => tab.key).filter(Boolean) as OrderStatus[]
  status.value = validStatuses.includes(queryStatus as OrderStatus)
    ? (queryStatus as OrderStatus)
    : ''
  load()
  close = connectOrderRealtime(() => load())
})
onBeforeUnmount(() => close())
// 从订单详情或售后页返回时重新读取数据库，确保最新订单状态立刻显示。
onShow(() => load())

async function load() {
  // 避免首次进入或实时推送时重复发起订单查询，保证页面只保留一个有效请求。
  if (loadingTask) return loadingTask
  loadingTask = loadWithRetry()
  try {
    await loadingTask
  } finally {
    loadingTask = null
  }
}

async function loadWithRetry() {
  loading.value = true
  loadError.value = false
  try {
    // 数据库连接刚唤醒时可能短暂失败，自动重试一次，减少首次打开的偶发错误。
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        orders.value = (await getOrdersApi(status.value || undefined)).data
        return
      } catch (error) {
        if (attempt === 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}
function select(value: OrderStatus | '') {
  // 切换订单状态时重新请求对应历史订单，并保留当前搜索条件。
  status.value = value
  load()
}

function toggleSearch() {
  // 控制右上角订单检索栏的展开状态，关闭时清空上一次检索词。
  searchVisible.value = !searchVisible.value
  if (!searchVisible.value) keyword.value = ''
}

function handleSearch() {
  // 搜索使用已加载的订单数据即时过滤，不改变当前状态筛选条件。
  keyword.value = keyword.value.trim()
}

function goDetail(id: number) {
  // 打开订单详情，查看商品、收货地址和物流信息。
  uni.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` })
}

function goPayment(id: number) {
  // 跳转支付结果页，继续处理当前待付款订单。
  uni.navigateTo({ url: `/pages/payment/payment?id=${id}` })
}

// 退款和售后共用申请页，但会携带不同类型以更新各自订单状态。
function goRefund(id: number) {
  uni.navigateTo({ url: `/pages/refund/refund?id=${id}&type=refund` })
}
function goAfterSale(id: number) {
  // 打开售后申请页，并标记当前申请类型为售后。
  uni.navigateTo({ url: `/pages/refund/refund?id=${id}&type=after-sale` })
}

function remindShipment() {
  // 提示用户发货提醒已经提交，实际发货由商家后台处理。
  uni.showToast({ title: '已提醒商家发货', icon: 'none' })
}

async function complete(id: number) {
  // 确认收货后重新加载订单列表，刷新订单状态。
  try {
    await completeOrderApi(id)
    uni.showToast({ title: '已确认收货', icon: 'none' })
    await load()
  } catch {
    /* 请求错误由统一请求层提示 */
  }
}
async function remove(id: number) {
  // 删除当前订单，并在成功后刷新历史订单列表。
  try {
    await deleteOrderApi(id)
    uni.showToast({ title: '订单已删除', icon: 'none' })
    await load()
  } catch {
    /* 请求错误由统一请求层提示 */
  }
}
function back() {
  // 返回上一页，保持从个人中心进入订单页时的导航路径。
  uni.navigateBack({ delta: 1 })
}

// 将后端订单状态转换为设计稿中的中文状态文案。
function statusText(value: OrderStatus) {
  return (
    {
      PENDING: '待付款',
      PAID: '待发货',
      SHIPPED: '待收货',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      AFTER_SALE: '售后中',
      REFUNDING: '退款中',
      REFUNDED: '已退款',
      REJECTED: '退款驳回',
    } as Record<OrderStatus, string>
  )[value]
}

// 订单卡片只展示第一件商品，数量和价格分别使用整单数量与订单总价。
function totalItemCount(order: Order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

// 将后端封面地址转换为当前端可访问的地址，并保留无图占位背景。
function coverStyle(url: string | null | undefined) {
  return url ? { backgroundImage: `url(${normalizeAssetUrl(url)})` } : {}
}
</script>
<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 0 28rpx calc(50rpx + env(safe-area-inset-bottom));
  background: #f8f4ea;
  color: #2c2416;
}

.topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 4rpx 30rpx;
}

.back {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #24433b;
}

.title-block {
  min-width: 0;
  flex: 1;
  margin: 0 18rpx;
}

.filter-action {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  flex: 0 0 72rpx;
  border-radius: 50%;
  background: #24433b;
}

.filter-action.active {
  background: #606c38;
}

.tap-soft {
  opacity: 0.78;
}

.title {
  display: block;
  font-family: Georgia, serif;
  font-size: 42rpx;
  font-weight: 700;
}

.sub {
  display: block;
  margin-top: 7rpx;
  color: #7a6e5e;
  font-size: 19rpx;
}

.search-panel {
  margin: -8rpx 4rpx 22rpx;
}

.search-result {
  display: block;
  margin: 10rpx 4rpx 0;
  color: #9f9381;
  font-size: 19rpx;
}

.tabs {
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 22rpx;
  padding: 0 4rpx;
  white-space: nowrap;
}

.tabs-track {
  display: inline-flex;
  align-items: center;
  gap: 18rpx;
  min-width: max-content;
  padding: 0 0 4rpx;
}

.tab {
  display: inline-flex;
  min-width: 112rpx;
  height: 68rpx;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 25rpx;
  border-radius: 16rpx;
  color: #606c38;
  background: #fffdf7;
  font-size: 23rpx;
  font-weight: 700;
  box-shadow: 0 4rpx 12rpx rgba(44, 36, 22, 0.04);
}

.tab.active {
  position: relative;
  color: #fffdf7;
  background: #606c38;
  box-shadow: none;
}

.tab.active::after {
  position: absolute;
  right: 28rpx;
  bottom: 8rpx;
  left: 28rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: #fffdf7;
  content: '';
}

.loading {
  text-align: center;
  padding-top: 120rpx;
}

.load-error {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 16rpx;
  padding-top: 120rpx;
  color: #9f9381;
  font-size: 23rpx;
}

.order-card {
  margin-bottom: 18rpx;
  padding: 22rpx;
  border-radius: 22rpx;
  background: #fffdf7;
}

.order-head {
  display: flex;
  justify-content: space-between;
  color: #9f9381;
  font-size: 19rpx;
}

.status {
  color: #c66b3d;
  font-weight: 800;
}

.line {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 20rpx;
}

.cover {
  width: 70rpx;
  height: 92rpx;
  border-radius: 8rpx;
  background: linear-gradient(145deg, #606c38, #c66b3d);
}

.line-copy {
  min-width: 0;
  flex: 1;
}

.line-copy text {
  display: block;
}

.line-copy text:first-child {
  overflow: hidden;
  color: #2c2416;
  font-size: 25rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-copy text:last-child {
  margin-top: 8rpx;
  color: #9f9381;
  font-size: 19rpx;
}

.amount {
  color: #c66b3d;
  font-size: 24rpx;
  font-weight: 800;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14rpx;
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(159, 147, 129, 0.16);
}

.order-actions .u-button {
  // 固定按钮宽度并禁止伸展，保证两个操作按钮靠右并排显示。
  width: 142rpx;
  min-width: 142rpx;
  flex: 0 0 142rpx;
  margin: 0;
  border-radius: 14rpx;
}
</style>
