<template>
  <view class="page">
    <u-navbar
      title=""
      :bg-color="theme.page"
      :border="false"
      :placeholder="true"
      :safe-area-inset-top="true"
    />
    <view class="topline"
      ><view class="back" @tap="back"><u-icon name="arrow-left" color="#FFFDF7" size="21" /></view
      ><view
        ><text class="title">确认订单</text><text class="sub">确认收货地址和商品信息</text></view
      ></view
    >
    <view class="section-label"><text>收货地址</text><text>点击切换</text></view>
    <view v-if="selectedAddress" class="address-card" @tap="addressVisible = true"
      ><view class="address-icon"><u-icon name="map" color="#C66B3D" size="23" /></view
      ><view class="address-copy"
        ><view class="person"
          ><text>{{ selectedAddress.receiverName }}</text
          ><text>{{ selectedAddress.receiverPhone }}</text
          ><text v-if="selectedAddress.isDefault" class="default-tag">默认</text></view
        ><text class="address-text">{{ fullAddress(selectedAddress) }}</text></view
      ><u-icon name="arrow-right" color="#B7AA96" size="18"
    /></view>
    <view v-else class="empty-address" @tap="goAddresses"
      ><u-icon name="plus-circle" color="#606C38" size="22" /><text>添加收货地址</text
      ><u-icon name="arrow-right" color="#B7AA96" size="18"
    /></view>
    <view class="section-label goods-heading"
      ><text>商品信息</text><text>{{ cart.items.length }} 件商品</text></view
    >
    <view v-if="loading" class="loading"><u-loading-icon color="#606C38" /></view>
    <view v-else class="goods-panel"
      ><view v-for="item in cart.items" :key="item.id" class="goods-row"
        ><view class="cover" :style="coverStyle(item.book.coverUrl)"></view
        ><view class="goods-copy"
          ><text class="book-title">{{ item.book.title }}</text
          ><text class="book-author">{{ item.book.author || '未知作者' }}</text
          ><text class="quantity">数量 x{{ item.quantity }}</text></view
        ><text class="line-amount">¥{{ item.subtotal.toFixed(2) }}</text></view
      ></view
    >
    <view class="remark-panel"
      ><text class="panel-title">订单备注</text
      ><u-textarea v-model="remark" placeholder="请输入订单备注（选填）" border="none" height="70"
    /></view>
    <!-- 地址弹窗使用地址管理中的真实数据，选中项高亮并显示勾选状态。 -->
    <u-popup :show="addressVisible" mode="bottom" :round="22" @close="addressVisible = false"
      ><view class="address-popup"
        ><view class="popup-head"
          ><text>选择收货地址</text
          ><u-icon name="close" color="#7A6E5E" size="20" @tap="addressVisible = false" /></view
        ><scroll-view class="address-scroll" scroll-y
          ><view
            v-for="item in addresses"
            :key="item.id"
            class="popup-address"
            :class="{ selected: selectedAddress?.id === item.id }"
            @tap="selectAddress(item)"
            ><view class="choose-mark"
              ><u-icon
                v-if="selectedAddress?.id === item.id"
                name="checkmark"
                color="#FFFDF7"
                size="15" /></view
            ><view class="popup-copy"
              ><view class="person"
                ><text>{{ item.receiverName }}</text
                ><text>{{ item.receiverPhone }}</text
                ><text v-if="item.isDefault" class="default-tag">默认</text></view
              ><text class="address-text">{{ fullAddress(item) }}</text></view
            ></view
          ><view v-if="!addresses.length" class="popup-empty"
            ><text>暂无收货地址</text></view
          ></scroll-view
        ><u-button
          class="manage-address"
          plain
          color="#24433B"
          text="管理收货地址"
          @click="goAddresses" /></view
    ></u-popup>
    <view class="bottom"
      ><view
        ><text>订单金额</text><text class="amount">¥{{ amount }}</text></view
      ><u-button
        color="#C66B3D"
        text="提交订单"
        :loading="submitting"
        :disabled="!cart.items.length"
        @click="submit"
    /></view>
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { createOrderApi, getAddressesApi, getCartApi } from '../../services/bookstore'
import { normalizeAssetUrl } from '../../services/assets'
import type { Address } from '../../types/address'
import type { CartData } from '../../types/cart'

const theme = { page: '#F8F4EA' }
const loading = ref(true)
const submitting = ref(false)
const addressVisible = ref(false)
const addresses = ref<Address[]>([])
const selectedAddress = ref<Address>()
const remark = ref('')
const cart = ref<CartData>({ items: [], totalCount: 0, selectedCount: 0, selectedAmount: 0 })
const amount = computed(() => Number(cart.value.selectedAmount || 0).toFixed(2))

onShow(load)
// 同时加载收货地址和购物车选中商品。
async function load() {
  loading.value = true
  try {
    // 地址和已选商品同时从数据库获取，保证确认订单页反映最新状态。
    const [addressResponse, cartResponse] = await Promise.all([getAddressesApi(), getCartApi()])
    addresses.value = addressResponse.data
    cart.value = {
      ...cartResponse.data,
      items: cartResponse.data.items.filter((item) => item.selected),
    }
    selectedAddress.value = addresses.value.find((item) => item.isDefault) || addresses.value[0]
  } finally {
    loading.value = false
  }
}
// 选择收货地址并关闭地址弹层。
function selectAddress(item: Address) {
  selectedAddress.value = item
  addressVisible.value = false
}
function fullAddress(item: Address) {
  return [item.province, item.city, item.district, item.detail].filter(Boolean).join(' ')
}
function coverStyle(url: string | null) {
  return url ? { backgroundImage: `url(${normalizeAssetUrl(url)})` } : {}
}
function goAddresses() {
  addressVisible.value = false
  uni.navigateTo({ url: '/pages/addresses/addresses' })
}
function back() {
  uni.navigateBack({ delta: 1 })
}
// 提交订单，并保存下单时的地址快照。
async function submit() {
  if (!selectedAddress.value) return uni.showToast({ title: '请选择收货地址', icon: 'none' })
  if (!cart.value.items.length) return uni.showToast({ title: '暂无可提交的商品', icon: 'none' })
  submitting.value = true
  try {
    // 订单保存完整地址快照，后续修改地址不会影响已创建的订单。
    const res = await createOrderApi({
      address: { ...selectedAddress.value },
      remark: remark.value,
    } as any)
    uni.redirectTo({ url: `/pages/payment/payment?id=${res.data.id}` })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
/* 确认订单页的内容区域使用清晰的卡片层次，避免背景颜色接近导致页面看起来没有样式。 */
.page {
  min-height: 100vh;
  padding: 0 28rpx 180rpx;
  background: #f8f4ea;
  color: #2c2416;
}

.topline {
  display: flex;
  align-items: center;
  gap: 18rpx;
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
  font-size: 20rpx;
}
.section-label {
  display: flex;
  justify-content: space-between;
  margin: 4rpx 4rpx 14rpx;
  font-size: 27rpx;
  font-weight: 800;
}
.section-label text:last-child {
  color: #a0927f;
  font-size: 19rpx;
  font-weight: 400;
}
.goods-heading {
  margin-top: 28rpx;
}

.address-card,
.empty-address {
  display: flex;
  min-height: 134rpx;
  align-items: center;
  gap: 16rpx;
  padding: 22rpx;
  border: 1rpx solid #eadfce;
  border-radius: 22rpx;
  background: #fffdf7;
  box-shadow: 0 8rpx 20rpx rgba(44, 36, 22, 0.05);
}
.address-icon {
  display: flex;
  width: 54rpx;
  height: 54rpx;
  flex: 0 0 54rpx;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: #e8dcc7;
}
.address-copy,
.popup-copy {
  min-width: 0;
  flex: 1;
}
.person {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
}
.person text:first-child {
  font-size: 27rpx;
  font-weight: 800;
}
.person text:nth-child(2) {
  color: #7a6e5e;
  font-size: 22rpx;
}
.default-tag {
  padding: 3rpx 9rpx;
  border-radius: 8rpx;
  background: #fff0e7;
  color: #c66b3d;
  font-size: 17rpx !important;
}
.address-text {
  display: block;
  margin-top: 9rpx;
  color: #7a6e5e;
  font-size: 21rpx;
  line-height: 1.45;
}
.empty-address {
  justify-content: center;
  color: #606c38;
  font-size: 24rpx;
}
.empty-address text {
  flex: 1;
  margin-left: 8rpx;
}
.loading {
  padding: 90rpx 0;
  text-align: center;
}

.goods-panel,
.remark-panel {
  overflow: hidden;
  border: 1rpx solid #eadfce;
  border-radius: 22rpx;
  background: #fffdf7;
  box-shadow: 0 8rpx 20rpx rgba(44, 36, 22, 0.05);
}
.goods-row {
  display: flex;
  min-height: 150rpx;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 22rpx;
  border-bottom: 1rpx solid rgba(159, 147, 129, 0.16);
}
.goods-row:last-child {
  border-bottom: 0;
}
.cover {
  width: 92rpx;
  height: 122rpx;
  flex: 0 0 92rpx;
  border-radius: 11rpx;
  background: #d4b895 linear-gradient(145deg, #606c38, #c66b3d);
  background-position: center;
  background-size: cover;
}
.goods-copy {
  min-width: 0;
  flex: 1;
}
.book-title {
  display: block;
  overflow: hidden;
  font-size: 25rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.book-author,
.quantity {
  display: block;
  margin-top: 7rpx;
  color: #7a6e5e;
  font-size: 20rpx;
}
.line-amount {
  align-self: flex-end;
  margin-bottom: 15rpx;
  color: #c66b3d;
  font-size: 24rpx;
  font-weight: 900;
}
.remark-panel {
  margin-top: 26rpx;
  padding: 22rpx;
}
.panel-title {
  display: block;
  margin-bottom: 10rpx;
  font-size: 27rpx;
  font-weight: 800;
}
.address-popup {
  padding: 26rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
  background: #f8f4ea;
}
.popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 800;
}
.address-scroll {
  max-height: 680rpx;
}
.popup-address {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 14rpx;
  padding: 20rpx;
  border: 2rpx solid transparent;
  border-radius: 18rpx;
  background: #fffdf7;
}
.popup-address.selected {
  border-color: #606c38;
  background: #f1f3e9;
}
.choose-mark {
  display: flex;
  width: 36rpx;
  height: 36rpx;
  flex: 0 0 36rpx;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #b7aa96;
  border-radius: 50%;
}
.selected .choose-mark {
  border-color: #606c38;
  background: #606c38;
}
.popup-empty {
  padding: 70rpx 0;
  color: #a0927f;
  font-size: 23rpx;
  text-align: center;
}
.manage-address {
  margin-top: 12rpx;
  border-radius: 18rpx;
}
.bottom {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #fffdf7;
  box-shadow: 0 -8rpx 24rpx rgba(44, 36, 22, 0.08);
}
.bottom > view {
  flex: 1;
}
.bottom text {
  display: block;
  color: #7a6e5e;
  font-size: 20rpx;
}
.bottom .amount {
  margin-top: 5rpx;
  color: #c66b3d;
  font-size: 32rpx;
  font-weight: 900;
}
.bottom .u-button {
  width: 230rpx;
  margin: 0;
}
</style>
