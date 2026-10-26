// 真机调试通过 VITE_API_ORIGIN 指向电脑局域网地址，避免连接到手机自身的 localhost。
function getSocketOrigin() {
  const configuredOrigin = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_ORIGIN
  if (configuredOrigin) return configuredOrigin.replace(/^http/i, 'ws').replace(/\/$/, '')
  if (typeof location !== 'undefined' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`
  }
  return 'ws://192.168.1.100:3001'
}

export function connectOrderRealtime(onChange: (order: unknown) => void) {
  const token = uni.getStorageSync('token')
  if (!token) return () => undefined
  // uni.connectSocket keeps the same client path on H5, App and WeChat mini program.
  const socket = uni.connectSocket({
    url: `${getSocketOrigin()}/ws/orders?token=${encodeURIComponent(token)}`,
  })
  socket.onMessage((event) => {
    try {
      const message = JSON.parse(String(event.data))
      if (message.type === 'ORDER_STATUS_CHANGED' || message.type === 'ORDER_DELETED')
        onChange(message.data)
    } catch {
      /* ignore malformed push */
    }
  })
  return () => socket.close({})
}
