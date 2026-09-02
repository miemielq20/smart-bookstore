declare module 'ws' {
  export class WebSocketServer {
    constructor(options?: any)
    handleUpgrade(request: any, socket: any, head: any, callback: (socket: any) => void): void
  }
}
