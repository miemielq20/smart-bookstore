// 图书列表和表单会复用的模块类型
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
}

// 图书详情会额外返回分类和标签名称，用于编辑弹窗回显。
export interface BookDetail extends BookItem {
  categories: string[]
  tags: string[]
}

// 图书分类下拉框选项
export interface BookCategoryOption {
  id: number
  name: string
}
