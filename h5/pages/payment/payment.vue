<template>
    <view class="page">
        <view class="success"><u-icon :name="order?.status === 'PENDING' ? 'clock' : 'checkmark-circle-fill'"
                :color="order?.status === 'PENDING' ? '#606C38' : '#C66B3D'" size="64" /><text
                class="title" :class="{ paid: order?.status !== 'PENDING' }">{{ order?.status === 'PENDING' ? '订单已提交' :
                    '订单已支付' }}</text><text class="sub">{{ order?.status === 'PENDING' ? '请完成模拟支付' : '支付成功，订单已进入待发货状态' }}</text></view>
        <view class="panel"><text>订单号</text><text class="value">{{ order?.orderNo || '-' }}</text><text>支付金额</text><text
                class="amount">¥{{ order?.totalAmount?.toFixed(2) || '0.00' }}</text></view><u-button
            v-if="order?.status === 'PENDING'" color="#C66B3D" text="模拟支付" :loading="loading" @click="pay" /><u-button
            v-else color="#24433B" text="查看订单" @click="goOrders" /><u-button class="secondary" text="返回首页"
            @click="home" />
    </view>
</template>
<script lang="ts" setup>
    import { onLoad } from '@dcloudio/uni-app'; import { onBeforeUnmount, ref } from 'vue'; import { getOrderApi, payOrderApi } from '../../services/bookstore'; import { connectOrderRealtime } from '../../services/order-realtime'; import type { Order } from '../../types/order'
    const order = ref<Order>(); const loading = ref(false); let close = () => undefined
    onLoad(async options => { const id = Number((options as any)?.id); if (id) { order.value = (await getOrderApi(id)).data; close = connectOrderRealtime(data => { if ((data as Order).id === id) order.value = data as Order }) } })
    onBeforeUnmount(() => close())
    async function pay() { if (!order.value) return; loading.value = true; try { order.value = (await payOrderApi(order.value.id)).data } finally { loading.value = false } } function goOrders() { uni.redirectTo({ url: '/pages/orders/orders' }) }

    function home() {
        // 首页并非原生 tabBar 页面，使用重启应用页面栈的方式保证支付完成后可稳定返回首页。
        uni.reLaunch({ url: '/pages/index/index' })
    }
</script>
<style lang="scss"
    scoped>
        .page {
            min-height: 100vh;
            padding: 120rpx 28rpx 60rpx;
            background: #f8f4ea;
            color: #2c2416
        }

        .success {
            display: flex;
            align-items: center;
            flex-direction: column;
            margin-bottom: 42rpx
        }

        .success .title {
            margin-top: 20rpx;
            font-family: Georgia, serif;
            font-size: 42rpx;
            font-weight: 700
        }

        .success .title.paid {
            color: #c66b3d
        }

        .sub {
            margin-top: 8rpx;
            color: #7a6e5e;
            font-size: 21rpx
        }

        .panel {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 22rpx 12rpx;
            margin-bottom: 32rpx;
            padding: 28rpx;
            border-radius: 22rpx;
            background: #fffdf7;
            color: #7a6e5e;
            font-size: 23rpx
        }

        .panel .value,
        .panel .amount {
            color: #2c2416;
            font-weight: 800
        }

        .panel .amount {
            color: #c66b3d;
            font-size: 30rpx
        }

        .u-button {
            margin-bottom: 16rpx;
            border-radius: 18rpx
        }

        .secondary {
            color: rgb(251, 250, 250) !important;
            background: #edc57f !important
        }
    </style>
