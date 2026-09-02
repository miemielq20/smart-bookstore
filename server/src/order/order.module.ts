import { Module } from '@nestjs/common'
import { OrderController } from './order.controller'
import { OrderRealtimeService } from './order.realtime'
import { OrderService } from './order.service'
import { AdminOrderController } from './admin-order.controller'
import { AdminOrderService } from './admin-order.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [OrderController, AdminOrderController],
  providers: [OrderService, AdminOrderService, OrderRealtimeService],
  exports: [OrderRealtimeService],
})
export class OrderModule {}
