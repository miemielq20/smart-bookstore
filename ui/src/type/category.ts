// 分类管理列表项，分类模块不展示子分类
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

// 分类下拉框选项
export interface CategoryOption {
  id: number
  name: string
}
