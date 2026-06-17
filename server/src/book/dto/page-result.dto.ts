// page-result.dto.ts
export class PageResult<T> {
  list!: T[];
  total!: number;
  page!: number;
  pageSize!: number;
}