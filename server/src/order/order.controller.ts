import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OrderService } from './order.service'

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly service: OrderService) {}
  @Post() create(
    @Req() req: Request,
    @Body() dto: { address?: Record<string, unknown>; remark?: string },
  ) {
    return this.service.create(this.userId(req), dto)
  }
  @Get() list(@Req() req: Request, @Query('status') status?: any) {
    return this.service.list(this.userId(req), status)
  }
  @Get(':id') detail(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.service.detail(this.userId(req), id)
  }
  @Post(':id/pay') pay(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.service.pay(this.userId(req), id)
  }
  @Post(':id/complete') complete(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.service.complete(this.userId(req), id)
  }
  @Post(':id/cancel') cancel(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(this.userId(req), id)
  }
  @Post(':id/refund') refund(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { reason?: string },
  ) {
    return this.service.refund(this.userId(req), id, dto.reason || '')
  }
  // 售后申请与退款申请分离，便于订单状态和后台审核准确区分。
  @Post(':id/after-sale') afterSale(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { reason?: string },
  ) {
    return this.service.afterSale(this.userId(req), id, dto.reason || '')
  }
  // 删除待付款、待发货或已完成订单，库存处理由服务层按订单状态决定。
  @Delete(':id') remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(this.userId(req), id)
  }
  private userId(req: Request) {
    return Number((req.user as { userId: number }).userId)
  }
}
