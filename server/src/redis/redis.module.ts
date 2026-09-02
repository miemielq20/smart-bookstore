// src/redis/redis.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          socket: {
            host: configService.get('REDIS_HOST', '127.0.0.1'),
            port: Number(configService.get('REDIS_PORT', 6379)),
            connectTimeout: 3000,
          },
          password: configService.get('REDIS_PASSWORD') || undefined,
        });

        client.on('error', (err) => console.error('Redis Error:', err));
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
