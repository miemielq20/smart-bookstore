export interface BookItem {
  id: number
  title: string
  author: string
  isbn: string | null
  coverUrl: string | null
  price: number
  originalPrice: number | null
  description: string | null
  language: string | null
  stock: number
  salesCount: number
  viewCount: number
  rating: number | null
  status: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  reading: string | null
  categories?: string[]
  tags?: string[]
}

export interface BookCategoryOption {
  id: number
  name: string
}

export interface HomeBookSection {
  title: string
  subtitle: string
  books: BookItem[]
}
