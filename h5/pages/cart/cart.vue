<template>
  <view class="page">
    <u-navbar
      title=""
      :bg-color="theme.page"
      :border="false"
      :placeholder="true"
      :safe-area-inset-top="true"
    />
    <view class="page-head">
      <view>
        <text class="title">购物车</text>
        <text v-if="cart.items.length" class="count">{{ cart.totalCount }} 件商品</text>
      </view>
      <view class="head-actions">
        <template v-if="editing">
          <text class="head-action clean-action" @tap="removeSelected">批量清理</text>
          <text class="head-action" @tap="exitEditing">退出管理</text>
        </template>
        <!-- 普通状态使用与首页、分类页统一的圆形功能图标入口。 -->
        <view v-else class="round-action manage-action" hover-class="tap-soft" @tap="toggleEditing">
          <u-icon name="edit-pen" color="#FFFDF7" size="26" />
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading"><u-loading-icon color="#606C38" /></view>
    <u-empty v-else-if="!cart.items.length" mode="cart" text="购物车还是空的" margin-top="100" />

    <view v-else class="cart-list">
      <view v-for="item in cart.items" :key="item.id" class="cart-item">
        <view
          class="check-mark"
          :class="{ checked: editing ? editSelectedIds.has(item.id) : item.selected }"
          @tap="editing ? toggleEditSelected(item.id) : toggleSelected(item)"
        >
          <u-icon
            v-if="editing ? editSelectedIds.has(item.id) : item.selected"
            name="checkmark"
            color="#7A7A7A"
            size="16"
          />
        </view>
        <view class="cover" :style="coverStyle(item.book.coverUrl)"></view>
        <view class="item-main">
          <text class="book-title">{{ item.book.title }}</text>
          <text class="author">{{ item.book.author || '未知作者' }}</text>
          <text v-if="!isAvailable(item)" class="warning">{{
            item.book.stock ? '图书已下架' : '库存不足'
          }}</text>
          <view class="item-foot">
            <text class="price">¥{{ formatPrice(item.book.price) }}</text>
            <view class="quantity-box">
              <view
                class="quantity-button"
                :class="{ disabled: item.quantity <= 1 }"
                @tap="changeQuantityBy(item, -1)"
              >
                −
              </view>
              <text class="quantity-value">{{ item.quantity }}</text>
              <view
                class="quantity-button"
                :class="{ disabled: item.quantity >= item.book.stock }"
                @tap="changeQuantityBy(item, 1)"
                >+</view
              >
            </view>
          </view>
        </view>
        <u-icon v-if="!editing" name="trash" color="#9f9381" size="20" @click="remove(item.id)" />
      </view>
    </view>

    <view v-if="cart.items.length" class="summary">
      <view v-if="editing" class="edit-actions">
        <view class="bottom-select" @tap="toggleEditAll">
          <view class="check-mark select-check" :class="{ checked: allEditSelected }">
            <u-icon v-if="allEditSelected" name="checkmark" color="#7A7A7A" size="16" />
          </view>
          <text>全选</text>
        </view>
        <u-button color="#C66B3D" plain text="分享" @click="shareSelected" />
        <u-button color="#C66B3D" plain text="移入收藏" @click="favoriteSelected" />
        <u-button color="#F13B4F" text="删除" @click="removeSelected" />
      </view>
      <template v-else>
        <view class="select-all" @tap="toggleAll">
          <view class="check-mark select-check" :class="{ checked: allSelected }">
            <u-icon v-if="allSelected" name="checkmark" color="#7A7A7A" size="16" />
          </view>
          <text>全选</text>
        </view>
        <view class="summary-info">
          <text class="summary-label">合计</text>
          <text class="total">¥{{ formatPrice(cart.selectedAmount) }}</text>
        </view>
        <u-button
          class="checkout"
          color="#C66B3D"
          :disabled="!cart.selectedCount"
          text="去结算"
          @click="checkout"
        />
      </template>
    </view>
    <AppTabBar current="cart" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import AppTabBar from '../../components/AppTabBar/AppTabBar.vue'
import { hasLoginToken } from '../../services/auth'
import {
  addFavoritesApi,
  batchDeleteCartItemsApi,
  getCartApi,
  removeCartItemApi,
  updateAllCartSelectedApi,
  updateCartQuantityApi,
  updateCartSelectedApi,
} from '../../services/bookstore'
import { normalizeAssetUrl } from '../../services/assets'
import type { CartData, CartItem } from '../../types'

const theme = { page: '#F8F4EA' }
const loading = ref(true)
const cart = ref<CartData>({ items: [], totalCount: 0, selectedCount: 0, selectedAmount: 0 })
const editing = ref(false)
const editSelectedIds = ref(new Set<number>())
const allSelected = computed(
  () => cart.value.items.length > 0 && cart.value.items.every((item) => item.selected),
)
const allEditSelected = computed(
  () =>
    cart.value.items.length > 0 &&
    cart.value.items.every((item) => editSelectedIds.value.has(item.id)),
)

function toggleEditing() {
  // 退出编辑模式时清空临时选择，避免下次进入时误操作上一次的商品。
  editing.value = !editing.value
  if (!editing.value) editSelectedIds.value = new Set()
}

function exitEditing() {
  // 退出管理时清空临时选择，避免再次进入时误操作商品。
  editing.value = false
  editSelectedIds.value = new Set()
}

onLoad(() => {
  if (!hasLoginToken()) {
    uni.redirectTo({ url: `/pages/login/login?redirect=${encodeURIComponent('/pages/cart/cart')}` })
    return
  }
  loadCart()
})
// 加载当前用户购物车，保持商品和库存状态最新。
async function loadCart() {
  loading.value = true
  try {
    cart.value = (await getCartApi()).data
  } finally {
    loading.value = false
  }
}

// 切换单个商品的结算选择状态。
async function toggleSelected(item: CartItem) {
  try {
    cart.value = (await updateCartSelectedApi(item.id, !item.selected)).data
  } catch {
    await loadCart()
  }
}

function toggleEditSelected(id: number) {
  // 编辑模式单独维护选择状态，不影响结算时的商品选择。
  const next = new Set(editSelectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  editSelectedIds.value = next
}

function toggleEditAll() {
  const next = new Set<number>()
  if (!allEditSelected.value) cart.value.items.forEach((item) => next.add(item.id))
  editSelectedIds.value = next
}

// 切换全部商品的结算选择状态。
async function toggleAll() {
  const selected = !allSelected.value
  try {
    cart.value = (await updateAllCartSelectedApi(selected)).data
  } catch {
    await loadCart()
  }
}

// 修改商品数量，并在失败时重新加载购物车。
async function changeQuantity(item: CartItem) {
  try {
    cart.value = (await updateCartQuantityApi(item.id, item.quantity)).data
  } catch {
    await loadCart()
  }
}

async function changeQuantityBy(item: CartItem, delta: number) {
  const next = item.quantity + delta
  if (next < 1 || next > item.book.stock || next === item.quantity) return
  item.quantity = next
  await changeQuantity(item)
}

// 删除单个购物车商品，并刷新购物车数据。
function remove(id: number) {
  uni.showModal({
    title: '删除商品',
    content: '确定要删除这本书吗？',
    confirmText: '确定',
    cancelText: '取消',
    confirmColor: '#E53935',
    cancelColor: '#2F80ED',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        cart.value = (await removeCartItemApi(id)).data
      } catch {
        await loadCart()
      }
    },
  })
}

// 删除编辑模式下选中的多个购物车商品。
function removeSelected() {
  const ids = [...editSelectedIds.value]
  if (!ids.length) return uni.showToast({ title: '请先选择商品', icon: 'none' })
  uni.showModal({
    title: '删除商品',
    content: `确定删除选中的 ${ids.length} 件商品吗？`,
    confirmText: '确定',
    cancelText: '取消',
    confirmColor: '#E53935',
    cancelColor: '#2F80ED',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        cart.value = (await batchDeleteCartItemsApi(ids)).data
        editSelectedIds.value = new Set()
      } catch {
        await loadCart()
      }
    },
  })
}

// 将编辑模式下选中的商品批量加入收藏。
async function favoriteSelected() {
  const bookIds = cart.value.items
    .filter((item) => editSelectedIds.value.has(item.id))
    .map((item) => item.book.id)
  if (!bookIds.length) return uni.showToast({ title: '请先选择商品', icon: 'none' })
  try {
    await addFavoritesApi(bookIds)
    uni.showToast({ title: '已加入收藏', icon: 'success' })
  } catch {
    /* 请求层已提示错误 */
  }
}

function shareSelected() {
  const items = cart.value.items.filter((item) => editSelectedIds.value.has(item.id))
  if (!items.length) return uni.showToast({ title: '请先选择商品', icon: 'none' })
  const title = items.map((item) => item.book.title).join('、')
  // H5/App 使用系统分享面板，小程序使用页面右上角分享能力。
  if (typeof (uni as any).share === 'function') {
    ;(uni as any).share({
      provider: 'system',
      type: 0,
      title: `我想和你分享：${title}`,
      summary: title,
      success: () => uni.showToast({ title: '分享成功', icon: 'success' }),
    })
  } else {
    uni.showToast({ title: '请点击右上角分享', icon: 'none' })
  }
}

onShareAppMessage(() => ({
  title: '我想和你分享购物车中的图书',
  path: '/pages/cart/cart',
}))

// 进入确认订单页面。
function checkout() {
  uni.navigateTo({ url: '/pages/order-confirm/order-confirm' })
}
function isAvailable(item: CartItem) {
  return item.book.status === 1 && item.book.stock >= item.quantity
}
function coverStyle(url: string | null) {
  return url ? { backgroundImage: `url(${normalizeAssetUrl(url)})` } : {}
}
function formatPrice(value: number | string | null) {
  return Number(value ?? 0).toFixed(2)
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 0 28rpx calc(170rpx + env(safe-area-inset-bottom));
  background: #f8f4ea;
  color: #2c2416;
}

.page-head {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 8rpx 28rpx;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 26rpx;
  padding-bottom: 8rpx;
}

.head-action {
  color: #24433b;
  font-size: 27rpx;
  font-weight: 700;
  white-space: nowrap;
}

.clean-action {
  color: #c66b3d;
}

.round-action {
  display: flex;
  width: 84rpx;
  height: 84rpx;
  flex: 0 0 84rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #606c38;
  box-shadow: 0 10rpx 22rpx rgba(96, 108, 56, 0.18);
}

.manage-action {
  margin-top: 4rpx;
}

.eyebrow {
  display: block;
  color: #9f9381;
  font-size: 22rpx;
}

.title {
  display: block;
  margin-top: 8rpx;
  font-size: 48rpx;
  font-weight: 900;
}

.count {
  color: #7a6e5e;
  font-size: 22rpx;
}

.loading {
  padding-top: 160rpx;
  text-align: center;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-height: 190rpx;
  margin-bottom: 18rpx;
  padding: 22rpx 18rpx;
  border-radius: 24rpx;
  background: #fffdf7;
}

.check-mark {
  display: flex;
  width: 34rpx;
  height: 34rpx;
  flex: 0 0 34rpx;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #cfc4b3;
  border-radius: 50%;
  background: #fffdf7;
}

.check-mark.checked {
  border-color: #9a9a9a;
  background: #fffdf7;
}

.cover {
  width: 112rpx;
  height: 148rpx;
  flex: 0 0 112rpx;
  border-radius: 12rpx;
  background: #d4b895 linear-gradient(145deg, #606c38, #c66b3d);
  background-size: cover;
  background-position: center;
}

.item-main {
  min-width: 0;
  flex: 1;
}

.book-title {
  display: block;
  overflow: hidden;
  font-size: 28rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author {
  display: block;
  margin-top: 8rpx;
  color: #7a6e5e;
  font-size: 22rpx;
}

.warning {
  display: block;
  margin-top: 8rpx;
  color: #c66b3d;
  font-size: 20rpx;
}

.item-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22rpx;
}

.quantity-box {
  display: flex;
  width: 150rpx;
  height: 48rpx;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  border: 1rpx solid #e4daca;
  border-radius: 8rpx;
  background: #fffdf7;
}

.quantity-button {
  display: flex;
  width: 48rpx;
  height: 48rpx;
  align-items: center;
  justify-content: center;
  color: #606c38;
  font-size: 34rpx;
  font-weight: 500;
  line-height: 1;
}

.quantity-button.disabled {
  color: #cfc4b3;
}

.quantity-value {
  min-width: 42rpx;
  color: #2c2416;
  font-size: 26rpx;
  text-align: center;
}

.price {
  color: #c66b3d;
  font-size: 30rpx;
  font-weight: 900;
}

.summary {
  position: fixed;
  right: 0;
  bottom: calc(112rpx + env(safe-area-inset-bottom));
  left: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 28rpx;
  background: #fffdf7;
  box-shadow: 0 -8rpx 24rpx rgba(44, 36, 22, 0.08);
}

.edit-actions {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10rpx;
}

.edit-actions .u-button {
  min-width: 0;
  flex: 1;
  margin: 0;
  padding: 0 8rpx;
  font-size: 22rpx;
}

.bottom-select {
  display: flex;
  flex: 0 0 108rpx;
  align-items: center;
  color: #7a6e5e;
  font-size: 22rpx;
}

.select-all {
  display: flex;
  align-items: center;
  color: #7a6e5e;
  font-size: 22rpx;
}

.select-check {
  margin-right: 8rpx;
}

.summary-info {
  flex: 1;
  text-align: right;
}

.summary-label {
  margin-right: 8rpx;
  color: #7a6e5e;
  font-size: 22rpx;
}

.total {
  color: #c66b3d;
  font-size: 32rpx;
  font-weight: 900;
}

.checkout {
  width: 180rpx;
  margin: 0;
}
</style>
