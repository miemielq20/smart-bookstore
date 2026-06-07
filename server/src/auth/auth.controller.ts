import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { PasswordLoginDto } from '../common/dto/login.dto'
import type { Request } from 'express'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* POST /api/auth/login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: PasswordLoginDto) {
    return this.authService.passwordLogin(dto)
  }

  /* GET /api/auth/menus — 返回当前用户菜单权限树 */
  @UseGuards(JwtAuthGuard)
  @Get('menus')
  async getMenus(@Req() req: Request) {
    const user = req.user as { userId: number; groupId: number | null }
    return this.authService.getUserMenus(user.groupId)
  }
}
