import { Module } from '@nestjs/common'
import { CaptchaService } from './captcha.service'
import { CaptchaController } from './captcha.controller'
import { RedisModule } from '../redis/redis.module'

@Module({
  imports: [RedisModule],
  controllers: [CaptchaController],
  providers: [CaptchaService],
  exports: [CaptchaService],
})
export class CaptchaModule {}
