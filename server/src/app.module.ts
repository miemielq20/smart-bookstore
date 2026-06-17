import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { RedisModule } from './redis/redis.module'
import { CaptchaModule } from './captcha/captcha.module'
import { PermissionGroupModule } from './permission-group/permission-group.module' 
import { ConfigModule } from '@nestjs/config'
import { BookService } from './book/book.service';
import { BookModule } from './book/book.module';
import { CategoryModule } from './category/category.module';
import { BannerModule } from './banner/banner.module';

@Module({
  imports: [PrismaModule, AuthModule, RedisModule, CaptchaModule, PermissionGroupModule,ConfigModule.forRoot({
    isGlobal: true,
  }), BookModule, CategoryModule, BannerModule],
  controllers: [AppController],
  providers: [AppService, BookService],
})
export class AppModule {}
