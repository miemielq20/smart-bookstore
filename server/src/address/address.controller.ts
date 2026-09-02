import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AddressDto } from './dto/address.dto'
import { AddressService } from './address.service'

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly service: AddressService) { }
  @Get() list(@Req() req: Request) { return this.service.list(this.userId(req)) }
  @Post() create(@Req() req: Request, @Body() dto: AddressDto) { return this.service.create(this.userId(req), dto) }
  @Put(':id') update(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: AddressDto) { return this.service.update(this.userId(req), id, dto) }
  @Post(':id/default') setDefault(@Req() req: Request, @Param('id', ParseIntPipe) id: number) { return this.service.setDefault(this.userId(req), id) }
  @Delete(':id') remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number) { return this.service.remove(this.userId(req), id) }
  private userId(req: Request) { return Number((req.user as { userId: number }).userId) }
}
