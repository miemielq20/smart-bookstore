import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { PasswordLoginDto } from '../common/dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ProfileDto } from './dto/profile.dto'
import { Put } from '@nestjs/common'
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

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  /* GET /api/auth/menus — 返回当前用户菜单权限树 */
  @UseGuards(JwtAuthGuard)
  @Get('menus')
  async getMenus(@Req() req: Request) {
    const user = req.user as { userId: number; groupId: number | null }
    return this.authService.getUserMenus(user.groupId)
  }

  // 获取当前登录用户的资料，供商城账号页使用。
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@Req() req: Request) {
    const user = req.user as { userId: number; accountType?: 'admin' | 'user' }
    return this.authService.getProfile(user.userId, user.accountType)
  }

  // 保存当前登录用户的资料，数据直接写入账号表。
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Req() req: Request, @Body() dto: ProfileDto) {
    const user = req.user as { userId: number; accountType?: 'admin' | 'user' }
    return this.authService.updateProfile(user.userId, user.accountType, dto)
  }
}
