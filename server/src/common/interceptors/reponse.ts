import { NestInterceptor, CallHandler, Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor {
  intercept(context, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // 如果 controller 自己返回了完整格式，保留它
        if (data && data.code !== undefined) return data
        // 否则帮忙包装
        return { data, code: 200, message: 'success' }
      }),
    )
  }
}
