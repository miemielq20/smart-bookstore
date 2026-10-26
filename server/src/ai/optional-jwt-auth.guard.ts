import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

// AI 对话允许游客访问，但登录用户需要附带身份以保存历史记录。
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(error: unknown, user: TUser) {
    if (error) return null
    return user ?? null
  }
}
