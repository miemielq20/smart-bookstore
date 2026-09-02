import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { OrderRealtimeService } from './order.realtime'
import { assertOrderStatusTransition, type OrderStatus } from './order-status.machine'

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: OrderRealtimeService,
  ) {}

  // 创建订单并在事务中完成库存扣减、订单快照保存和购物车清理。
  // 创建订单并在事务中完成库存扣减、订单快照保存和购物车清理。
  async create(userId: number, dto: { address?: Record<string, unknown>; remark?: string }) {
    const user = BigInt(userId)
    const cart = await this.prisma.cartItems.findMany({ where: { userId: user, selected: 1 } })
    if (!cart.length) throw new BadRequestException('没有可结算的商品')
    const books = await this.prisma.books.findMany({
      where: { id: { in: cart.map((item) => item.bookId) }, deletedAt: null },
    })
    const bookMap = new Map(books.map((book) => [book.id.toString(), book]))
    const rows = cart
      .map((item) => ({ item, book: bookMap.get(item.bookId.toString()) }))
      .filter((row) => row.book)
    if (rows.length !== cart.length) throw new BadRequestException('部分图书已下架，请刷新购物车')
    for (const { item, book } of rows) {
      if (book!.status !== 1 || book!.stock < item.quantity)
        throw new BadRequestException(`${book!.title}库存不足或已下架`)
    }
    const amount = rows.reduce((sum, row) => sum + Number(row.book!.price) * row.item.quantity, 0)
    const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`
    const order = await this.prisma.$transaction(async (tx) => {
      const addressSnapshot = JSON.parse(JSON.stringify(dto.address || {}))
      const created = await tx.orders.create({
        data: {
          userId: user,
          orderNo,
          totalAmount: amount.toFixed(2),
          addressSnapshot,
          remark: dto.remark,
          expireAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      })
      for (const { item, book } of rows) {
        const snapshot = {
          id: Number(book!.id),
          title: book!.title,
          author: book!.author,
          coverUrl: book!.coverUrl,
          price: Number(book!.price),
          originalPrice: book!.originalPrice === null ? null : Number(book!.originalPrice),
        }
        await tx.orderItems.create({
          data: {
            orderId: created.id,
            bookId: book!.id,
            bookSnapshot: snapshot,
            price: book!.price,
            quantity: item.quantity,
          },
        })
        await tx.books.update({
          where: { id: book!.id },
          data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
        })
        await tx.cartItems.delete({ where: { id: item.id } })
      }
      return created
    })
    return this.detail(userId, Number(order.id))
  }

  // 查询当前用户订单，并按可选状态筛选。
  // 查询当前用户订单，并按可选状态筛选。
  async list(userId: number, status?: OrderStatus) {
    // 查询参数来自 URL，先校验状态，避免异常字符串进入 Prisma 查询导致 500。
    const validStatuses: OrderStatus[] = [
      'PENDING',
      'PAID',
      'SHIPPED',
      'COMPLETED',
      'CANCELLED',
      'AFTER_SALE',
      'REFUNDING',
      'REFUNDED',
      'REJECTED',
    ]
    if (status && !validStatuses.includes(status)) throw new BadRequestException('订单状态参数无效')
    // Prisma 客户端重新生成前，新状态需要在数据库边界显式转换为枚举值。
    const orders = await this.prisma.orders.findMany({
      where: { userId: BigInt(userId), ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' },
    })
    // 订单列表需要展示完整商品和订单总价，不能只返回第一件商品。
    return Promise.all(orders.map((order) => this.format(order)))
  }

  // 查询当前用户的订单详情。
  // 查询当前用户的订单详情。
  async detail(userId: number, id: number) {
    const order = await this.prisma.orders.findFirst({
      where: { id: BigInt(id), userId: BigInt(userId) },
    })
    if (!order) throw new NotFoundException('订单不存在')
    return this.format(order)
  }

  // 模拟订单支付，并记录支付成功信息。
  // 模拟订单支付，并记录支付成功信息。
  async pay(userId: number, id: number) {
    const order = await this.getOwned(userId, id)
    assertOrderStatusTransition(order.status as OrderStatus, 'PAID')
    const now = new Date()
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.orders.update({ where: { id: order.id }, data: { status: 'PAID', paidAt: now } })
      await tx.paymentRecords.create({
        data: {
          orderId: order.id,
          paymentNo: `PAY${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
          amount: order.totalAmount,
          status: 'SUCCESS',
          paidAt: now,
        },
      })
      return tx.orders.findUniqueOrThrow({ where: { id: order.id } })
    })
    const data = await this.format(result)
    this.realtime.publish(userId, data)
    return data
  }

  // 确认收货并完成订单。
  // 确认收货并完成订单。
  async complete(userId: number, id: number) {
    return this.changeStatus(userId, id, 'COMPLETED')
  }
  // 取消订单并通过状态机校验当前状态。
  // 取消订单并通过状态机校验当前状态。
  async cancel(userId: number, id: number) {
    return this.changeStatus(userId, id, 'CANCELLED')
  }
  async remove(userId: number, id: number) {
    const order = await this.getOwned(userId, id)
    if (!['PENDING', 'PAID', 'COMPLETED'].includes(order.status as string))
      throw new BadRequestException('当前订单状态不允许删除')
    await this.prisma.$transaction(async (tx) => {
      // 下单时已经扣减库存，删除未完成订单时必须恢复库存和销量；已完成订单只清理记录。
      const items = await tx.orderItems.findMany({ where: { orderId: order.id } })
      if (order.status !== 'COMPLETED')
        for (const item of items)
          await tx.books.update({
            where: { id: item.bookId },
            data: { stock: { increment: item.quantity }, salesCount: { decrement: item.quantity } },
          })
      // 订单相关表没有配置级联删除，因此显式清理关联记录。
      await tx.paymentRecords.deleteMany({ where: { orderId: order.id } })
      await tx.refundRecords.deleteMany({ where: { orderId: order.id } })
      await tx.orderItems.deleteMany({ where: { orderId: order.id } })
      await tx.orders.delete({ where: { id: order.id } })
    })
    // 通知仍打开订单页的客户端重新查询列表，保证删除结果实时同步。
    this.realtime.publishDeleted(userId, Number(order.id))
    return { id: Number(order.id), deleted: true }
  }
  // 创建退款申请并将订单转入退款审核状态。
  // 创建退款申请并将订单转入退款审核状态。
  async refund(userId: number, id: number, reason: string) {
    const order = await this.getOwned(userId, id)
    assertOrderStatusTransition(order.status as OrderStatus, 'REFUNDING')
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orders.update({ where: { id: order.id }, data: { status: 'REFUNDING' } })
      await tx.refundRecords.create({
        data: {
          orderId: order.id,
          refundNo: `RF${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
          amount: order.totalAmount,
          reason: reason || '用户申请退款',
        },
      })
      return tx.orders.findUniqueOrThrow({ where: { id: order.id } })
    })
    const data = await this.format(updated)
    this.realtime.publish(userId, data)
    return data
  }

  // 创建售后申请，并保留用户提交的售后说明。
  // 创建售后申请，并保留用户提交的售后说明。
  async afterSale(userId: number, id: number, reason: string) {
    const order = await this.getOwned(userId, id)
    assertOrderStatusTransition(order.status as OrderStatus, 'AFTER_SALE')
    // 售后请求暂存至订单备注，后台可在订单详情中查看用户提交的说明。
    const updated = await this.prisma.orders.update({
      where: { id: order.id },
      data: { status: 'AFTER_SALE' as any, remark: reason.trim() || order.remark },
    })
    const data = await this.format(updated)
    this.realtime.publish(userId, data)
    return data
  }

  private async changeStatus(userId: number, id: number, next: OrderStatus) {
    const order = await this.getOwned(userId, id)
    assertOrderStatusTransition(order.status as OrderStatus, next)
    const updated = await this.prisma.orders.update({
      where: { id: order.id },
      data: {
        status: next as any,
        ...(next === 'COMPLETED' ? { completedAt: new Date() } : {}),
        ...(next === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
      },
    })
    const data = await this.format(updated)
    this.realtime.publish(userId, data)
    return data
  }

  private async getOwned(userId: number, id: number) {
    const order = await this.prisma.orders.findFirst({
      where: { id: BigInt(id), userId: BigInt(userId) },
    })
    if (!order) throw new NotFoundException('订单不存在')
    return order
  }

  private async format(order: any) {
    // 统一返回完整订单商品，前端才能正确呈现每件商品及整单金额。
    const items = await this.prisma.orderItems.findMany({ where: { orderId: order.id } })
    return {
      id: Number(order.id),
      orderNo: order.orderNo,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      addressSnapshot: order.addressSnapshot,
      remark: order.remark,
      trackingNo: order.trackingNo,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: items.map((item) => ({
        id: Number(item.id),
        bookId: Number(item.bookId),
        book: item.bookSnapshot,
        price: Number(item.price),
        quantity: item.quantity,
      })),
    }
  }
}
