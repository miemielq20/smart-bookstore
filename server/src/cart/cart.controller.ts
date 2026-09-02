import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AddCartItemDto } from './dto/add-cart-item.dto'
import { UpdateCartQuantityDto } from './dto/update-cart-quantity.dto'
import { UpdateCartSelectedDto } from './dto/update-cart-selected.dto'
import { BatchCartItemsDto } from './dto/batch-cart-items.dto'
import { CartService } from './cart.service'

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: Request) {
    return this.cartService.getCart(this.userId(req))
  }

  @Post('items')
  addItem(@Req() req: Request, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(this.userId(req), dto)
  }

  @Post('items/:id/quantity')
  updateQuantity(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCartQuantityDto) {
    return this.cartService.updateQuantity(this.userId(req), id, dto.quantity)
  }

  @Post('items/:id/selected')
  updateSelected(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCartSelectedDto) {
    return this.cartService.updateSelected(this.userId(req), id, dto.selected)
  }

  @Post('items/selected-all')
  updateAllSelected(@Req() req: Request, @Body() dto: UpdateCartSelectedDto) {
    return this.cartService.updateAllSelected(this.userId(req), dto.selected)
  }

  @Delete('items/:id')
  removeItem(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.cartService.removeItem(this.userId(req), id)
  }

  @Post('items/batch-delete')
  batchDelete(@Req() req: Request, @Body() dto: BatchCartItemsDto) {
    return this.cartService.batchDelete(this.userId(req), dto.ids)
  }

  @Post('clear-selected')
  clearSelected(@Req() req: Request) {
    return this.cartService.clearSelected(this.userId(req))
  }

  private userId(req: Request) {
    return Number((req.user as { userId: number }).userId)
  }
}
