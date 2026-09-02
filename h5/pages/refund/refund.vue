<template>
    <view class="page">
        <u-navbar title="" :bg-color="theme.page" :border="false" :placeholder="true" :safe-area-inset-top="true" />
        <view class="topline"><view class="back" @tap="back"><u-icon name="arrow-left" color="#FFFDF7" size="21" /></view><view><text class="title">{{ isAfterSale ? '申请售后' : '申请退款' }}</text><text class="sub">请如实填写申请信息</text></view></view>
        <view v-if="order" class="goods-card"><view class="cover" :style="coverStyle(order.items[0]?.book.coverUrl)"></view><view class="goods-copy"><text>{{ order.items[0]?.book.title || '图书商品' }}</text><text>共 {{ totalItemCount }} 件</text></view></view>
        <view class="form-panel"><view class="form-row"><text class="label">申请类型</text><text class="row-value strong">{{ isAfterSale ? '我要售后' : '我要退款（无需退货）' }}</text></view><view class="form-row selectable" @tap="receiptPickerVisible = true"><text class="label">收货状态</text><text class="row-value" :class="{ placeholder: !receiptStatus }">{{ receiptStatus || '点击选择收货状态' }}</text><u-icon name="arrow-right" color="#B8B1A5" size="18" /></view><view class="form-row selectable" @tap="reasonPickerVisible = true"><text class="label">申请原因</text><text class="row-value" :class="{ placeholder: !reason }">{{ reason || '点击选择申请原因' }}</text><u-icon name="arrow-right" color="#B8B1A5" size="18" /></view></view>
        <view class="amount-panel"><text class="amount-label">申请金额</text><text class="amount">¥{{ order?.totalAmount.toFixed(2) }}</text><text class="amount-tip">退款金额将原路退回</text></view>
        <view class="description-panel"><view class="description-head"><text>申请说明</text><text>{{ description.length }}/170</text></view><u-textarea v-model="description" :maxlength="170" placeholder="必填，请详细填写申请说明" border="none" height="180" /></view>
        <view class="contact"><text>联系电话</text><text>{{ order?.addressSnapshot.receiverPhone || '-' }}</text></view>
        <view class="footer"><u-button color="#C66B3D" text="提交申请" :loading="loading" @click="submit" /></view>
        <u-picker :show="receiptPickerVisible" :columns="receiptColumns" key-name="label" @confirm="confirmReceipt" @cancel="receiptPickerVisible = false" @close="receiptPickerVisible = false" /><u-picker :show="reasonPickerVisible" :columns="reasonColumns" key-name="label" @confirm="confirmReason" @cancel="reasonPickerVisible = false" @close="reasonPickerVisible = false" />
    </view>
</template>
<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { afterSaleOrderApi, getOrderApi, refundOrderApi } from '../../services/bookstore'
import { normalizeAssetUrl } from '../../services/assets'
import type { Order } from '../../types/order'
const theme = { page: '#F8F4EA' }; const order = ref<Order>(); const orderId = ref(0); const isAfterSale = ref(false); const receiptStatus = ref(''); const reason = ref(''); const description = ref(''); const loading = ref(false); const receiptPickerVisible = ref(false); const reasonPickerVisible = ref(false)
const receiptColumns = [[{ label: '未收到货' }, { label: '已收到货' }]]; const reasonColumns = [[{ label: '不想要了' }, { label: '商品破损' }, { label: '商品与描述不符' }, { label: '错发、漏发商品' }, { label: '其他原因' }]]
const totalItemCount = computed(() => order.value?.items.reduce((sum, item) => sum + item.quantity, 0) || 0)
onLoad(async options => { orderId.value = Number((options as any)?.id || 0); isAfterSale.value = (options as any)?.type === 'after-sale'; if (orderId.value) order.value = (await getOrderApi(orderId.value)).data })
// 选择器仅回填用户明确选中的值，关闭弹层不影响已经填写的表单。
function confirmReceipt(event: { value: Array<{ label: string }> }) { receiptStatus.value = event.value[0]?.label || ''; receiptPickerVisible.value = false }
function confirmReason(event: { value: Array<{ label: string }> }) { reason.value = event.value[0]?.label || ''; reasonPickerVisible.value = false }
async function submit() { if (!order.value || !receiptStatus.value || !reason.value || !description.value.trim()) return uni.showToast({ title: '请完成申请信息', icon: 'none' }); loading.value = true; try { const applicationReason = `收货状态：${receiptStatus.value}；申请原因：${reason.value}；申请说明：${description.value.trim()}`; if (isAfterSale.value) await afterSaleOrderApi(order.value.id, applicationReason); else await refundOrderApi(order.value.id, applicationReason); uni.showToast({ title: '申请已提交', icon: 'success' }); setTimeout(() => uni.redirectTo({ url: `/pages/order-detail/order-detail?id=${order.value?.id}` }), 350) } finally { loading.value = false } }
function back() { uni.navigateBack({ delta: 1 }) }
// 将订单封面地址转换为当前端可访问的静态资源地址。
function coverStyle(url: string | null | undefined) { return url ? { backgroundImage: `url(${normalizeAssetUrl(url)})` } : {} }
</script>
<style lang="scss" scoped>
.page {
    box-sizing: border-box;
    min-height: 100vh;
    padding: 0 28rpx 160rpx;
    overflow: hidden;
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
    flex: 0 0 72rpx;
    border-radius: 24rpx;
    background: #24433b;
}

.title {
    display: block;
    font-family: Georgia, serif;
    font-size: 42rpx;
    font-weight: 700;
    line-height: 1.2;
}

.sub {
    display: block;
    margin-top: 7rpx;
    color: #7a6e5e;
    font-size: 20rpx;
}

.goods-card,
.form-panel,
.amount-panel,
.description-panel,
.contact {
    box-sizing: border-box;
    margin-bottom: 18rpx;
    border: 1rpx solid rgba(159, 147, 129, 0.18);
    border-radius: 18rpx;
    background: #fffdf7;
    box-shadow: 0 4rpx 14rpx rgba(44, 36, 22, 0.04);
}

.goods-card {
    display: flex;
    align-items: center;
    gap: 18rpx;
    padding: 24rpx;
}

.cover {
    width: 82rpx;
    height: 108rpx;
    flex: 0 0 82rpx;
    border-radius: 8rpx;
    background: #606c38 center / cover no-repeat;
}

.goods-copy {
    min-width: 0;
    flex: 1;
}

.goods-copy text {
    display: block;
}

.goods-copy text:first-child {
    overflow: hidden;
    font-size: 25rpx;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.goods-copy text:last-child {
    margin-top: 10rpx;
    color: #9f9381;
    font-size: 20rpx;
}

.form-panel {
    padding: 0;
}

.form-row {
    display: flex;
    min-height: 98rpx;
    align-items: center;
    gap: 18rpx;
    padding: 0 24rpx;
    border-bottom: 1rpx solid rgba(159, 147, 129, 0.16);
}

.form-row:last-child {
    border-bottom: 0;
}

.label {
    width: 145rpx;
    flex: 0 0 145rpx;
    font-size: 25rpx;
}

.row-value {
    overflow: hidden;
    flex: 1;
    color: #2c2416;
    font-size: 24rpx;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.row-value.strong {
    font-weight: 800;
}

.placeholder {
    color: #b8b1a5;
}

.selectable:active {
    background: rgba(232, 220, 199, 0.45);
}

.amount-panel {
    display: flex;
    flex-direction: column;
    padding: 24rpx;
}

.amount-label {
    color: #7a6e5e;
    font-size: 23rpx;
}

.amount {
    margin-top: 10rpx;
    color: #c66b3d;
    font-size: 48rpx;
    font-weight: 900;
    line-height: 1.2;
}

.amount-tip {
    margin-top: 10rpx;
    color: #9f9381;
    font-size: 20rpx;
}

.description-panel {
    padding: 24rpx 24rpx 12rpx;
}

.description-head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8rpx;
    color: #2c2416;
    font-size: 25rpx;
}

.description-head text:last-child {
    color: #9f9381;
    font-size: 20rpx;
}

.description-panel :deep(.u-textarea) {
    min-height: 180rpx;
    padding: 0 !important;
    background: transparent !important;
}

.contact {
    display: flex;
    justify-content: space-between;
    padding: 24rpx;
    color: #7a6e5e;
    font-size: 23rpx;
}

.contact text:last-child {
    color: #2c2416;
    font-weight: 700;
}

.footer {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 5;
    box-sizing: border-box;
    padding: 20rpx 28rpx;
    background: #fffdf7;
    box-shadow: 0 -4rpx 16rpx rgba(44, 36, 22, 0.08);
}

.footer :deep(.u-button) {
    width: 100%;
    min-height: 82rpx;
    margin: 0;
    border-radius: 14rpx;
}
</style>
