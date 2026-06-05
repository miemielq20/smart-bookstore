import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { RedisModule } from './redis/redis.module'
import { CaptchaModule } from './captcha/captcha.module'

@Module({
  imports: [PrismaModule, AuthModule, RedisModule, CaptchaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
