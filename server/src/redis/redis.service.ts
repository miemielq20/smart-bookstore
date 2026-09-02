// src/redis/redis.service.ts
import { Inject, Injectable } from '@nestjs/common'
import type { RedisClientType } from 'redis'

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly client: RedisClientType) {}

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await this.client.setEx(key, ttl, value)
    } else {
      await this.client.set(key, value)
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async del(key: string) {
    return this.client.del(key)
  }
}
