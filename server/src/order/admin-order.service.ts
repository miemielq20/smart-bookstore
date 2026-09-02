import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { OrderRealtimeService } from './order.realtime'
import { assertOrderStatusTransition, type OrderStatus } from './order-status.machine'

const validStatuses: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'AFTER_SALE', 'REFUNDING', 'REFUNDED', 'REJECTED']

@Injectable()
export class AdminOrderService {
  constructor(private readonly prisma: PrismaService, private readonly realtime: OrderRealtimeService) {}

  async list(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 10, 1), 100)
    const status = query.status as OrderStatus | undefined
    if (status && !validStatuses.includes(status)) throw new BadRequestException('订单状态参数无效')
    const where: any = { ...(status ? { status } : {}) }
    if (query.dateFrom || query.dateTo) where.createdAt = { ...(query.dateFrom ? { gte: new Date(`${query.dateFrom}T00:00:00`) } : {}), ...(query.dateTo ? { lte: new Date(`${query.dateTo}T23:59:59`) } : {}) }
    const orders = await this.prisma.orders.findMany({ where, orderBy: { createdAt: query.sortOrder === 'asc' ? 'asc' : 'desc' } })
    const users = await this.userMap(orders.map(order => order.userId))
    const keyword = query.keyword?.trim().toLowerCase()
    const rows = await Promise.all(orders.map(async order => {
      const address = order.addressSnapshot as Record<string, string>
      const user = users.get(order.userId.toString())
      const itemCount = await this.prisma.orderItems.aggregate({ where: { orderId: order.id }, _sum: { quantity: true } })
      return this.serialize(order, { user, address, itemCount: itemCount._sum.quantity || 0 })
    }))
    // 地址快照保存在 JSON 字段，关键词过滤在格式化后执行以兼容 MySQL 配置。
    const filtered = keyword ? rows.filter(row => [row.orderNo, row.receiverName, row.receiverPhone, row.userNickname, row.userPhone].some(value => String(value || '').toLowerCase().includes(keyword))) : rows
    return { list: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize }
  }

  async detail(id: number) {
    const order = await this.getOrder(id)
    const [items, payments, refunds, users] = await Promise.all([
      this.prisma.orderItems.findMany({ where: { orderId: order.id } }),
      this.prisma.paymentRecords.findMany({ where: { orderId: order.id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.refundRecords.findMany({ where: { orderId: order.id }, orderBy: { createdAt: 'desc' } }),
      this.userMap([order.userId]),
    ])
    const address = order.addressSnapshot as Record<string, string>
    const user = users.get(order.userId.toString())
    return { ...this.serialize(order, { user, address, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) }), address, items: items.map(item => ({ id: Number(item.id), bookId: Number(item.bookId), book: item.bookSnapshot, price: Number(item.price), quantity: item.quantity })), payments: payments.map(item => ({ paymentNo: item.paymentNo, amount: Number(item.amount), method: item.method, status: item.status, paidAt: item.paidAt })), refunds: refunds.map(item => ({ id: Number(item.id), refundNo: item.refundNo, amount: Number(item.amount), reason: item.reason, status: item.status, handlerNote: item.handlerNote, handledAt: item.handledAt })) }
  }

  async ship(id: number, trackingNo: string) {
    if (!trackingNo.trim()) throw new BadRequestException('请填写物流单号')
    const order = await this.getOrder(id)
    assertOrderStatusTransition(order.status as OrderStatus, 'SHIPPED')
    const updated = await this.prisma.orders.update({ where: { id: order.id }, data: { status: 'SHIPPED', trackingNo: trackingNo.trim(), shippedAt: new Date() } })
    await this.publish(updated)
    return this.detail(id)
  }

  async remark(id: number, remark: string) {
    const order = await this.prisma.orders.update({ where: { id: BigInt(id) }, data: { remark: remark.trim() || null } }).catch(() => { throw new NotFoundException('订单不存在') })
    await this.publish(order)
    return this.detail(id)
  }

  async cancel(id: number) {
    const order = await this.getOrder(id)
    assertOrderStatusTransition(order.status as OrderStatus, 'CANCELLED')
    const updated = await this.prisma.$transaction(async tx => {
      const items = await tx.orderItems.findMany({ where: { orderId: order.id } })
      // 取消未履约订单后同步释放预扣库存和销量。
      for (const item of items) await tx.books.update({ where: { id: item.bookId }, data: { stock: { increment: item.quantity }, salesCount: { decrement: item.quantity } } })
      return tx.orders.update({ where: { id: order.id }, data: { status: 'CANCELLED', cancelledAt: new Date() } })
    })
    await this.publish(updated)
    return this.detail(id)
  }

  async approveAfterSale(id: number) {
    const order = await this.getOrder(id)
    assertOrderStatusTransition(order.status as OrderStatus, 'REFUNDING')
    const updated = await this.prisma.$transaction(async tx => {
      // 售后申请确认后创建退款记录，后续由退款管理页面完成最终审核。
      await tx.refundRecords.create({ data: { orderId: order.id, refundNo: `RF${Date.now()}${Math.random().toString(36).slice(2, 7)}`, amount: order.totalAmount, reason: order.remark || '用户申请售后退款' } })
      return tx.orders.update({ where: { id: order.id }, data: { status: 'REFUNDING' as any } })
    })
    await this.publish(updated)
    return this.detail(id)
  }

  async rejectAfterSale(id: number) {
    const order = await this.getOrder(id)
    assertOrderStatusTransition(order.status as OrderStatus, 'SHIPPED')
    const updated = await this.prisma.orders.update({ where: { id: order.id }, data: { status: 'SHIPPED' } })
    await this.publish(updated)
    return this.detail(id)
  }

  async reshipAfterSale(id: number, trackingNo: string) {
    if (!trackingNo.trim()) throw new BadRequestException('请填写新的物流单号')
    const order = await this.getOrder(id)
    assertOrderStatusTransition(order.status as OrderStatus, 'SHIPPED')
    const updated = await this.prisma.orders.update({ where: { id: order.id }, data: { status: 'SHIPPED', trackingNo: trackingNo.trim(), shippedAt: new Date() } })
    await this.publish(updated)
    return this.detail(id)
  }

  async stats() {
    const [totalCount, todayOrders, groups] = await Promise.all([
      this.prisma.orders.count(),
      this.prisma.orders.findMany({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, select: { totalAmount: true } }),
      this.prisma.orders.groupBy({ by: ['status'], _count: { _all: true } }),
    ])
    const counts = Object.fromEntries(groups.map(item => [item.status, item._count._all]))
    return { totalCount, pendingCount: counts.PENDING || 0, paidCount: counts.PAID || 0, shippedCount: counts.SHIPPED || 0, completedCount: counts.COMPLETED || 0, cancelledCount: counts.CANCELLED || 0, afterSaleCount: counts.AFTER_SALE || 0, refundingCount: counts.REFUNDING || 0, todayCount: todayOrders.length, todayAmount: todayOrders.reduce((sum, item) => sum + Number(item.totalAmount), 0) }
  }

  async refunds(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page) || 1, 1); const pageSize = Math.min(Math.max(Number(query.pageSize) || 10, 1), 100)
    const where: any = query.status ? { status: query.status as any } : {}
    const [total, records] = await Promise.all([this.prisma.refundRecords.count({ where }), this.prisma.refundRecords.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize })])
    const orderMap = new Map((await this.prisma.orders.findMany({ where: { id: { in: records.map(record => record.orderId) } } })).map(order => [order.id.toString(), order]))
    const users = await this.userMap(Array.from(orderMap.values()).map(order => order.userId))
    return { list: records.map(record => { const order = orderMap.get(record.orderId.toString()); const user = order ? users.get(order.userId.toString()) : undefined; return { id: Number(record.id), refundNo: record.refundNo, orderId: Number(record.orderId), orderNo: order?.orderNo || '-', userNickname: user?.nickname || user?.username || '-', amount: Number(record.amount), reason: record.reason, status: record.status, handlerNote: record.handlerNote, handledAt: record.handledAt, createdAt: record.createdAt } }), total, page, pageSize }
  }

  async reviewRefund(id: number, approve: boolean, handlerId: number, handlerNote = '') {
    const record = await this.prisma.refundRecords.findUnique({ where: { id: BigInt(id) } })
    if (!record) throw new NotFoundException('退款申请不存在')
    if (record.status !== 'PENDING') throw new BadRequestException('退款申请已处理')
    if (!approve && !handlerNote.trim()) throw new BadRequestException('请填写拒绝原因')
    const order = await this.getOrder(Number(record.orderId))
    const next: OrderStatus = approve ? 'REFUNDED' : 'REJECTED'
    assertOrderStatusTransition(order.status as OrderStatus, next)
    const updated = await this.prisma.$transaction(async tx => {
      await tx.refundRecords.update({ where: { id: record.id }, data: { status: approve ? 'APPROVED' : 'REJECTED', handlerId: BigInt(handlerId), handlerNote: handlerNote.trim() || null, handledAt: new Date() } })
      if (approve) {
        const items = await tx.orderItems.findMany({ where: { orderId: order.id } })
        // 退款审核通过后归还商品库存，并回退此前累计的销量。
        for (const item of items) await tx.books.update({ where: { id: item.bookId }, data: { stock: { increment: item.quantity }, salesCount: { decrement: item.quantity } } })
      }
      return tx.orders.update({ where: { id: order.id }, data: { status: next } })
    })
    await this.publish(updated)
    return this.detail(Number(order.id))
  }

  private async getOrder(id: number) { const order = await this.prisma.orders.findUnique({ where: { id: BigInt(id) } }); if (!order) throw new NotFoundException('订单不存在'); return order }
  private async userMap(ids: bigint[]) { const users = await this.prisma.userAccounts.findMany({ where: { id: { in: ids } }, select: { id: true, username: true, nickname: true, phone: true } }); return new Map(users.map(user => [user.id.toString(), user])) }
  private serialize(order: any, extra: { user?: any; address: Record<string, string>; itemCount: number }) { return { id: Number(order.id), orderNo: order.orderNo, userId: Number(order.userId), userNickname: extra.user?.nickname || extra.user?.username || '-', userPhone: extra.user?.phone || '', receiverName: extra.address.receiverName || '', receiverPhone: extra.address.receiverPhone || '', totalAmount: Number(order.totalAmount), status: order.status, trackingNo: order.trackingNo, itemCount: extra.itemCount, remark: order.remark, paidAt: order.paidAt, shippedAt: order.shippedAt, completedAt: order.completedAt, cancelledAt: order.cancelledAt, createdAt: order.createdAt, updatedAt: order.updatedAt } }
  private async publish(order: any) { const items = await this.prisma.orderItems.findMany({ where: { orderId: order.id }, take: 1 }); this.realtime.publish(Number(order.userId), { id: Number(order.id), orderNo: order.orderNo, totalAmount: Number(order.totalAmount), status: order.status, addressSnapshot: order.addressSnapshot, remark: order.remark, trackingNo: order.trackingNo, createdAt: order.createdAt, updatedAt: order.updatedAt, items: items.map(item => ({ id: Number(item.id), bookId: Number(item.bookId), book: item.bookSnapshot, price: Number(item.price), quantity: item.quantity })) }) }
}
