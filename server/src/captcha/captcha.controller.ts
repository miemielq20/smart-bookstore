import { Controller, Get } from '@nestjs/common'
import { CaptchaService } from './captcha.service'

@Controller('getCode')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  getCaptcha() {
    return this.captchaService.generate()
    .then(({ uuid, base64, mime }) => ({
      uuid,
      img: `data:${mime};base64,${base64}`,
    }))
  }
}
