import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'sm_sys_jwt_secret_key_2026',
    })
  }

  async validate(payload: { sub: number; username: string; groupId: number | null }) {
    return {
      userId: payload.sub,
      username: payload.username,
      groupId: payload.groupId,
    }
  }
}
