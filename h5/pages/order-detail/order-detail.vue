<template>
    <view class="page"><u-navbar title="" :bg-color="theme.page" :border="false" :placeholder="true"
            :safe-area-inset-top="true" />
        <view class="topline">
            <view class="back" @tap="back"><u-icon name="arrow-left" color="#FFFDF7" size="21" /></view>
            <view><text class="title">订单详情</text><text class="sub">{{ order?.orderNo || '加载中' }}</text></view>
        </view>
        <view v-if="order" class="content">
            <view class="state"><text class="state-title">{{ statusText(order.status) }}</text><text
                    class="state-sub">订单状态实时更新</text><text class="state-time">下单时间：{{ formatDate(order.createdAt) }}</text></view>
            <view class="panel address"><u-icon name="map" color="#C66B3D" size="25" />
                <view><text>{{ order.addressSnapshot.receiverName ||
                    '收货信息' }}</text><text>{{ order.addressSnapshot.receiverPhone ||
                            '' }}</text><text>{{ order.addressSnapshot.detail || '暂无地址' }}</text></view>
            </view>
            <view class="panel"><text class="panel-title">商品清单</text>
                <view v-for="item in order.items" :key="item.id" class="line">
                    <view class="cover" :style="coverStyle(item.book.coverUrl)"></view>
                    <view class="line-copy"><text>{{ item.book.title || '图书商品' }}</text><text>{{ item.quantity }}
                            件</text>
                    </view><text class="amount">¥{{ (item.price * item.quantity).toFixed(2) }}</text>
                </view>
            </view>
            <view class="panel summary"><text>订单金额</text><text class="total">¥{{ order.totalAmount.toFixed(2) }}</text>
            </view>
            <view class="actions"><u-button v-if="order.status === 'PAID' || order.status === 'AFTER_SALE'" color="#C66B3D" text="申请退款" @click="refund" />
                <u-button v-if="order.status === 'SHIPPED'" color="#FFF0E7" text="申请售后"
                    @click="afterSale" />
                <u-button v-if="order.status === 'PENDING'" color="#E8DCC7" text="取消订单" @click="remove" />
                <u-button v-if="order.status === 'PENDING'" color="#C66B3D" text="立即支付" @click="pay" /><u-button
                    v-if="order.status === 'SHIPPED'" color="#24433B" text="确认收货" @click="complete" />
                <u-button v-if="order.status === 'COMPLETED'" color="#9F9381" text="删除订单" @click="remove" />
            </view>
        </view>
    </view>
</template>
<script lang="ts" setup>
    import { onLoad } from '@dcloudio/uni-app'; import { onBeforeUnmount, ref } from 'vue'; import { completeOrderApi, deleteOrderApi, getOrderApi, payOrderApi } from '../../services/bookstore'; import { normalizeAssetUrl } from '../../services/assets'; import { connectOrderRealtime } from '../../services/order-realtime'; import type { Order, OrderStatus } from '../../types/order'
    const theme = { page: '#F8F4EA' }; const order = ref<Order>(); let close = () => undefined
    onLoad(async options => { const id = Number((options as any)?.id); if (id) { await loadOrder(id); close = connectOrderRealtime(data => { const message = data as { id?: number; deleted?: boolean }; if (message.id === id && message.deleted) { order.value = undefined; uni.redirectTo({ url: '/pages/orders/orders' }); return } if (message.id === id) loadOrder(id) }) } }); onBeforeUnmount(() => close())
    // 每次操作成功后重新读取详情，确保商品、物流及状态完全与数据库一致。
    async function loadOrder(id: number) { order.value = (await getOrderApi(id)).data }
    async function pay() { if (order.value) { await payOrderApi(order.value.id); await loadOrder(order.value.id) } }
    async function complete() { if (order.value) { await completeOrderApi(order.value.id); await loadOrder(order.value.id) } }
    // 退款和售后均进入申请页，并根据类型调用不同状态接口。
    function refund() { if (order.value) uni.navigateTo({ url: `/pages/refund/refund?id=${order.value.id}&type=refund` }) }
    function afterSale() { if (order.value) uni.navigateTo({ url: `/pages/refund/refund?id=${order.value.id}&type=after-sale` }) }
    async function remove() {
        if (!order.value) return
        try {
            await deleteOrderApi(order.value.id)
            uni.showToast({ title: '订单已删除', icon: 'none' })
            setTimeout(() => uni.redirectTo({ url: '/pages/orders/orders' }), 350)
        } catch { /* 请求错误由统一请求层提示 */ }
    }
    function back() { uni.navigateBack({ delta: 1 }) }
    function statusText(v: OrderStatus) { return ({ PENDING: '待付款', PAID: '待发货', SHIPPED: '待收货', COMPLETED: '已完成', CANCELLED: '已取消', AFTER_SALE: '售后中', REFUNDING: '退款中', REFUNDED: '已退款', REJECTED: '退款驳回' } as Record<OrderStatus, string>)[v] }
    // 订单详情展示数据库中的下单时间，保持与订单记录一致。
    function formatDate(value: string) { return value?.slice(0, 16).replace('T', ' ') || '-' }
    // 订单保存的是下单时的封面快照，优先使用快照地址展示商品图片。
    function coverStyle(url: string | null | undefined) { return url ? { backgroundImage: `url(${normalizeAssetUrl(url)})` } : {} }
</script>
<style lang="scss" scoped>
    .page {
        min-height: 100vh;
        padding: 0 28rpx 60rpx;
        background: #f8f4ea;
        color: #2c2416
    }

    .topline {
        display: flex;
        align-items: center;
        gap: 18rpx;
        padding: 24rpx 4rpx 30rpx
    }

    .back {
        display: flex;
        width: 72rpx;
        height: 72rpx;
        align-items: center;
        justify-content: center;
        border-radius: 24rpx;
        background: #24433b
    }

    .title {
        display: block;
        font-family: Georgia, serif;
        font-size: 42rpx;
        font-weight: 700
    }

    .sub {
        display: block;
        margin-top: 7rpx;
        color: #7a6e5e;
        font-size: 20rpx
    }

    .state {
        margin-bottom: 22rpx;
        padding: 28rpx;
        border-radius: 22rpx;
        background: #24433b;
        color: #fffdf7
    }

    .state-title {
        display: block;
        font-size: 32rpx;
        font-weight: 800
    }

    .state-sub {
        display: block;
        margin-top: 8rpx;
        color: rgba(255, 253, 247, .7);
        font-size: 19rpx
    }

    .state-time {
        display: block;
        margin-top: 14rpx;
        color: rgba(255, 253, 247, .78);
        font-size: 20rpx
    }

    .panel {
        margin-bottom: 20rpx;
        padding: 24rpx;
        border-radius: 22rpx;
        background: #fffdf7
    }

    .address {
        display: flex;
        gap: 16rpx
    }

    .address text {
        display: block;
        margin-bottom: 6rpx;
        font-size: 22rpx
    }

    .address text:last-child {
        color: #7a6e5e;
        font-size: 20rpx
    }

    .panel-title {
        display: block;
        margin-bottom: 12rpx;
        font-size: 27rpx;
        font-weight: 800
    }

    .line {
        display: flex;
        align-items: center;
        gap: 14rpx;
        margin-top: 18rpx
    }

    .cover {
        width: 70rpx;
        height: 92rpx;
        border-radius: 8rpx;
        background: linear-gradient(145deg, #606c38, #c66b3d)
    }

    .line-copy {
        min-width: 0;
        flex: 1
    }

    .line-copy text {
        display: block
    }

    .line-copy text:first-child {
        font-size: 24rpx;
        font-weight: 800
    }

    .line-copy text:last-child {
        margin-top: 7rpx;
        color: #9f9381;
        font-size: 19rpx
    }

    .amount,
    .total {
        color: #c66b3d;
        font-weight: 900
    }

    .summary {
        display: flex;
        justify-content: space-between;
        color: #7a6e5e;
        font-size: 23rpx
    }

    .total {
        font-size: 30rpx
    }

    .actions {
        display: flex;
        width: 100%;
        align-items: center;
        flex-direction: column;
        gap: 14rpx;
    }

    .actions :deep(.u-button) {
        // 详情页每行只显示一个操作按钮，并占满内容区域宽度。
        width: 100%;
        min-width: 100%;
        flex: 0 0 auto;
        margin: 0;
        border-radius: 18rpx
    }

</style>
