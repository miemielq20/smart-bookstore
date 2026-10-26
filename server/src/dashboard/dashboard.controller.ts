import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview')
  overview(@Req() req: Request, @Query('days') days?: string) {
    this.ensureAdmin(req);
    return this.service.overview(this.normalizeDays(days));
  }

  @Get('traffic')
  traffic(@Req() req: Request, @Query('days') days?: string) {
    this.ensureAdmin(req);
    return this.service.traffic(this.normalizeDays(days));
  }

  private normalizeDays(value?: string) {
    const parsed = Number(value);
    if (parsed === 30 || parsed === 90) return parsed;
    return 7;
  }

  private ensureAdmin(req: Request) {
    const user = req.user as { accountType?: string };
    if (user?.accountType !== 'admin') {
      throw new ForbiddenException('无后台管理权限');
    }
  }
}
