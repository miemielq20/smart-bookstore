export function connectOrderRealtime(onChange: (order: unknown) => void) {
  const token = uni.getStorageSync('token')
  if (!token) return () => undefined
  // uni.connectSocket keeps the same client path on H5, App and WeChat mini program.
  const socket = uni.connectSocket({
    url: `ws://localhost:3000/ws/orders?token=${encodeURIComponent(token)}`,
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
