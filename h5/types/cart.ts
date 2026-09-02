import type { BookItem } from './book'

export interface CartItem {
  id: number
  quantity: number
  selected: boolean
  subtotal: number
  book: BookItem
}

export interface CartData {
  items: CartItem[]
  totalCount: number
  selectedCount: number
  selectedAmount: number
}
