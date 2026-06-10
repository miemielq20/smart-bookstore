import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { RedisModule } from './redis/redis.module'
import { CaptchaModule } from './captcha/captcha.module'
import { PermissionGroupModule } from './permission-group/permission-group.module' 
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [PrismaModule, AuthModule, RedisModule, CaptchaModule, PermissionGroupModule,ConfigModule.forRoot({
    isGlobal: true,
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
