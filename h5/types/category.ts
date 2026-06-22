export interface CategoryItem {
  id: number
  name: string
  sort: number
  icon: string | null
  status: number
  createdAt: string
  updatedAt: string
  bookCount: number
}

export interface CategoryOption {
  id: number
  name: string
}
