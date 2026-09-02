import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { FavoriteService } from './favorite.service'

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly service: FavoriteService) {}

  @Get()
  list(@Req() req: Request) { return this.service.list(this.userId(req)) }

  @Post('batch')
  batchAdd(@Req() req: Request, @Body() body: { bookIds?: number[] }) {
    // 批量收藏使用事务，重复收藏会被忽略，保证操作可重复执行。
    return this.service.batchAdd(this.userId(req), body.bookIds || [])
  }

  @Post(':bookId')
  add(@Req() req: Request, @Param('bookId', ParseIntPipe) bookId: number) {
    return this.service.add(this.userId(req), bookId)
  }

  @Delete(':bookId')
  remove(@Req() req: Request, @Param('bookId', ParseIntPipe) bookId: number) {
    return this.service.remove(this.userId(req), bookId)
  }

  private userId(req: Request) { return Number((req.user as { userId: number }).userId) }
}
