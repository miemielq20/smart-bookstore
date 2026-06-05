// captcha/captcha.service.ts
import { Injectable } from '@nestjs/common';
import { createCaptcha, type CaptchaResult } from 'colorful-captcha';
// 假设你已有 RedisService
import { RedisService } from '../redis/redis.service';
import { randomUUID } from 'crypto';

@Injectable()
export class CaptchaService {
  private readonly TTL = 60; // 秒

  constructor(private readonly redis: RedisService) {}

  async generate(): Promise<{
    uuid: string;
    base64: string;   // 前端可直接 <img src="data:image/png;base64,xxx"/>
    mime: string;
  }> {
    // 异步生成验证码图片
    const result: CaptchaResult = await createCaptcha({
      width: 180,
      height: 60,
      length: 4,
      mode: 'normal',     // 'easy' | 'normal' | 'hard'
      format: 'png',
      noRepeat: true,
    });

    const uuid = randomUUID();
    // 存答案（统一小写防大小写坑）
    await this.redis.set(
      `captcha:${uuid}`,
      result.text.toLowerCase(),
      this.TTL,
    );

    return {
      uuid,
      mime: result.mime,
      base64: result.buffer.toString('base64'),
    };
  }

  async validate(uuid: string, input: string): Promise<boolean> {
    const key = `captcha:${uuid}`;
    const saved = await this.redis.get(key);
    if (!saved) return false;
    const ok = saved === input.toLowerCase();
    if (ok) await this.redis.del(key); // 一次性使用
    return ok;
  }
}