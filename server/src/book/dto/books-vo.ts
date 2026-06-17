export class BookVo {
  id!: number;
  title!: string;
  author!: string;
  isbn?: string;
  category!: string;
  price!: number;
  coverUrl?: string;
  originalPrice?: number;
  stock!: number;
  sales!: number;
  status!: number; // 1 上架 0 下架
  createdAt!: Date;
}