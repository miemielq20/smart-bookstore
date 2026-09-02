import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import {ResponseInterceptor} from './common/interceptors/reponse'
import {HttpExceptionFilter} from './common/filters/http-exception.filter'
import dotenv from 'dotenv'
import { OrderRealtimeService } from './order/order.realtime'


dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
 
  // 修复 BigInt 序列化问题
  if (!(BigInt.prototype as any).toJSON) {
    (BigInt.prototype as any).toJSON = function () {
      return this.toString()
    }
  }

  /* 全局前缀：所有接口以 /api 开头 */
  app.setGlobalPrefix('api')

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
  await app.listen(process.env.PORT ?? 3000)
  app.get(OrderRealtimeService).attach(app.getHttpServer())
}
bootstrap()
