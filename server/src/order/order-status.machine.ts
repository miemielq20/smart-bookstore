import { BadRequestException } from '@nestjs/common'

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'AFTER_SALE' | 'REFUNDING' | 'REFUNDED' | 'REJECTED'

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'REFUNDING', 'CANCELLED'],
  SHIPPED: ['COMPLETED', 'AFTER_SALE'],
  COMPLETED: ['AFTER_SALE'],
  CANCELLED: [],
  // 售后申请后仍可继续提交退款申请，由后台统一审核退款结果。
  // 售后可重新发货、拒绝售后返回待收货，或转入退款审核。
  AFTER_SALE: ['SHIPPED', 'REFUNDING'],
  REFUNDING: ['REFUNDED', 'REJECTED'],
  REFUNDED: [],
  REJECTED: [],
}

export function assertOrderStatusTransition(current: OrderStatus, next: OrderStatus) {
  if (current === next) return
  if (!transitions[current]?.includes(next)) throw new BadRequestException(`不允许订单从${current}变更为${next}`)
}
