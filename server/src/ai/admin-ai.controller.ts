import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiConfigService } from './ai-config.service';
import { AdminAiConfigDto } from './dto/admin-ai-config.dto';

@Controller('admin/ai')
@UseGuards(JwtAuthGuard)
export class AdminAiController {
  constructor(private readonly aiConfigService: AiConfigService) {}

  @Get('config')
  getConfig(@Req() req: Request) {
    this.ensureAdmin(req);
    return this.aiConfigService.getPublicConfig();
  }

  @Put('config')
  updateConfig(@Req() req: Request, @Body() dto: AdminAiConfigDto) {
    const userId = this.ensureAdmin(req);
    return this.aiConfigService.updateConfig(dto, userId);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  testConnection(@Req() req: Request) {
    this.ensureAdmin(req);
    return this.aiConfigService.testConnection();
  }

  private ensureAdmin(req: Request) {
    const user = req.user as { accountType?: string; userId?: number };
    if (user?.accountType !== 'admin') {
      throw new ForbiddenException('无后台管理权限');
    }
    return Number(user.userId);
  }
}
