import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { mkdirSync } from 'node:fs'
import { extname } from 'node:path'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { PasswordLoginDto } from '../common/dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ProfileDto } from './dto/profile.dto'
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

  /* GET /api/auth/menus - 返回当前用户菜单权限树 */
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

  // 上传商城用户头像或背景图，管理员账号不使用用户资料图片接口。
  @UseGuards(JwtAuthGuard)
  @Post('profile/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const directory = 'uploads/user'
          mkdirSync(directory, { recursive: true })
          callback(null, directory)
        },
        filename: (_req, file, callback) => {
          const suffix = extname(file.originalname).toLowerCase() || '.jpg'
          callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`)
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('只能上传图片文件'), false)
          return
        }
        callback(null, true)
      },
    }),
  )
  async uploadProfileImage(@Req() req: Request, @UploadedFile() file?: { filename: string }) {
    const user = req.user as { accountType?: 'admin' | 'user' }
    if (user.accountType !== 'user') throw new BadRequestException('管理员不支持商城用户图片上传')
    if (!file) throw new BadRequestException('请选择图片')
    return { url: `/uploads/user/${file.filename}` }
  }
}
