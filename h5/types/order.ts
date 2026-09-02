export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'AFTER_SALE' | 'REFUNDING' | 'REFUNDED' | 'REJECTED'
export interface OrderItem { id: number; bookId: number; book: { title?: string; author?: string; coverUrl?: string | null }; price: number; quantity: number }
export interface Order { id: number; orderNo: string; totalAmount: number; status: OrderStatus; addressSnapshot: Record<string, string>; remark?: string | null; trackingNo?: string | null; createdAt: string; updatedAt: string; items: OrderItem[] }
