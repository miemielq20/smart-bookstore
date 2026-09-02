import { BadRequestException } from '@nestjs/common'

export enum BookStatus {
  OFF_SHELF = 0,
  ON_SHELF = 1,
}

const transitions: Record<BookStatus, BookStatus[]> = {
  [BookStatus.OFF_SHELF]: [BookStatus.ON_SHELF],
  [BookStatus.ON_SHELF]: [BookStatus.OFF_SHELF],
}

export function assertBookStatusTransition(current: number, next: number) {
  if (![BookStatus.OFF_SHELF, BookStatus.ON_SHELF].includes(next)) {
    throw new BadRequestException('图书状态不合法')
  }
  if (current === next) return
  if (!transitions[current as BookStatus]?.includes(next as BookStatus)) {
    throw new BadRequestException('不允许的图书状态变更')
  }
}

export function isBookPurchasable(status: number, stock: number) {
  return status === BookStatus.ON_SHELF && stock > 0
}
