import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Put, Query, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminOrderService } from './admin-order.service'

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminOrderController {
  constructor(private readonly service: AdminOrderService) {}
  @Get('orders') list(@Req() req: Request, @Query() query: Record<string, string | undefined>) { this.ensureAdmin(req); return this.service.list(query) }
  @Get('orders/stats') stats(@Req() req: Request) { this.ensureAdmin(req); return this.service.stats() }
  @Get('orders/:id') detail(@Req() req: Request, @Param('id', ParseIntPipe) id: number) { this.ensureAdmin(req); return this.service.detail(id) }
  @Put('orders/:id/ship') ship(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: { trackingNo?: string }) { this.ensureAdmin(req); return this.service.ship(id, dto.trackingNo || '') }
  @Put('orders/:id/remark') remark(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: { remark?: string }) { this.ensureAdmin(req); return this.service.remark(id, dto.remark || '') }
  @Put('orders/:id/cancel') cancel(@Req() req: Request, @Param('id', ParseIntPipe) id: number) { this.ensureAdmin(req); return this.service.cancel(id) }
  // 管理员确认售后后，将订单转入退款审核流程。
  @Put('orders/:id/after-sale/approve') approveAfterSale(@Req() req: Request, @Param('id', ParseIntPipe) id: number) { this.ensureAdmin(req); return this.service.approveAfterSale(id) }
  // 售后拒绝后订单恢复为待收货状态，用户可以继续查看物流信息。
  @Put('orders/:id/after-sale/reject') rejectAfterSale(@Req() req: Request, @Param('id', ParseIntPipe) id: number) { this.ensureAdmin(req); return this.service.rejectAfterSale(id) }
  // 售后补发商品后订单恢复为待收货状态并更新物流单号。
  @Put('orders/:id/after-sale/reship') reshipAfterSale(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: { trackingNo?: string }) { this.ensureAdmin(req); return this.service.reshipAfterSale(id, dto.trackingNo || '') }
  @Get('refunds') refunds(@Req() req: Request, @Query() query: Record<string, string | undefined>) { this.ensureAdmin(req); return this.service.refunds(query) }
  @Put('refunds/:id/approve') approve(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: { handlerNote?: string }) { return this.service.reviewRefund(id, true, this.ensureAdmin(req), dto.handlerNote || '') }
  @Put('refunds/:id/reject') reject(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: { handlerNote?: string }) { return this.service.reviewRefund(id, false, this.ensureAdmin(req), dto.handlerNote || '') }
  // 后台订单接口仅接受管理员令牌，商城用户令牌不可访问。
  private ensureAdmin(req: Request) { const user = req.user as { accountType?: string; userId: number }; if (user.accountType !== 'admin') throw new ForbiddenException('无后台管理权限'); return Number(user.userId) }
}
