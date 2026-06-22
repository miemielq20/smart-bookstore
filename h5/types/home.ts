import type { BannerItem } from './banner'
import type { BookItem, HomeBookSection } from './book'
import type { CategoryOption } from './category'

export interface HomeViewState {
  banners: BannerItem[]
  categories: CategoryOption[]
  hotBooks: BookItem[]
  newBooks: BookItem[]
  sections: HomeBookSection[]
}

export interface CategoryViewState {
  activeCategory: string
  categories: CategoryOption[]
  books: BookItem[]
  total: number
}
