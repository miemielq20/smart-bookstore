import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { ResponseInterceptor } from './common/interceptors/reponse'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import dotenv from 'dotenv'
import { OrderRealtimeService } from './order/order.realtime'
import express from 'express'
import { join } from 'node:path'

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 修复 BigInt 序列化问题
  if (!(BigInt.prototype as any).toJSON) {
    ;(BigInt.prototype as any).toJSON = function () {
      return this.toString()
    }
  }

  /* 全局前缀：所有接口以 /api 开头 */
  app.setGlobalPrefix('api')

  // 暴露商城用户头像和背景图，数据库只保存可长期访问的 URL。
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')))

  /* 全局校验管道：class-validator 自动生效 */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())
  // 监听所有网卡，允许同一局域网内的手机访问开发服务。
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0')
  console.log(`服务已启动: ${await app.getUrl()}`)
  app.get(OrderRealtimeService).attach(app.getHttpServer())
}
bootstrap()
