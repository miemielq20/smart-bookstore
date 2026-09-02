import { Injectable } from '@nestjs/common'
import type { Server as HttpServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class OrderRealtimeService {
  private readonly clients = new Map<number, Set<any>>()
  private socketServer?: WebSocketServer
  constructor(private readonly jwt: JwtService) {}

  attach(server: HttpServer) {
    this.socketServer = new WebSocketServer({ noServer: true })
    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '/', 'http://localhost')
      if (url.pathname !== '/ws/orders') return
      const token = url.searchParams.get('token')
      let userId = 0
      try { userId = Number(this.jwt.verify(token || '').sub) } catch { return socket.destroy() }
      if (!userId) return socket.destroy()
      this.socketServer!.handleUpgrade(request, socket, head, ws => {
        const list = this.clients.get(userId) || new Set<any>()
        list.add(ws)
        this.clients.set(userId, list)
        ws.on('close', () => { list.delete(ws); if (!list.size) this.clients.delete(userId) })
      })
    })
  }

  publish(userId: number, order: unknown) {
    const payload = JSON.stringify({ type: 'ORDER_STATUS_CHANGED', data: order })
    for (const client of this.clients.get(userId) || []) if (client.readyState === 1) client.send(payload)
  }

  // 删除订单后推送专用事件，前端收到后重新查询当前订单列表。
  publishDeleted(userId: number, orderId: number) {
    const payload = JSON.stringify({ type: 'ORDER_DELETED', data: { id: orderId, deleted: true } })
    for (const client of this.clients.get(userId) || []) if (client.readyState === 1) client.send(payload)
  }
}
