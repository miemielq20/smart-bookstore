import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import dotenv from 'dotenv'


dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

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

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
