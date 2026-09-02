import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AddressDto } from './dto/address.dto'

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}
  // 查询用户未删除的地址，并将默认地址排在最前面。
  // 查询用户未删除的地址，并将默认地址排在最前面。
  async list(userId: number) {
    const rows = await this.prisma.userAddresses.findMany({
      where: { userId: BigInt(userId), deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    })
    return rows.map((row) => this.format(row))
  }
  // 创建收货地址，并确保同一用户最多只有一个默认地址。
  // 创建收货地址，并确保同一用户最多只有一个默认地址。
  async create(userId: number, dto: AddressDto) {
    const count = await this.prisma.userAddresses.count({
      where: { userId: BigInt(userId), deletedAt: null },
    })
    const isDefault = dto.isDefault === 1 || count === 0 ? 1 : 0
    return this.prisma.$transaction(async (tx) => {
      if (isDefault)
        await tx.userAddresses.updateMany({
          where: { userId: BigInt(userId), deletedAt: null },
          data: { isDefault: 0 },
        })
      return this.format(
        await tx.userAddresses.create({
          data: { ...this.input(dto), userId: BigInt(userId), isDefault },
        }),
      )
    })
  }
  // 更新用户自己的收货地址，并同步维护默认地址状态。
  // 更新用户自己的收货地址，并同步维护默认地址状态。
  async update(userId: number, id: number, dto: AddressDto) {
    const current = await this.find(userId, id)
    const isDefault = dto.isDefault === 1 ? 1 : current.isDefault
    return this.prisma.$transaction(async (tx) => {
      if (isDefault)
        await tx.userAddresses.updateMany({
          where: { userId: BigInt(userId), deletedAt: null },
          data: { isDefault: 0 },
        })
      return this.format(
        await tx.userAddresses.update({
          where: { id: current.id },
          data: { ...this.input(dto), isDefault, updatedAt: new Date() },
        }),
      )
    })
  }
  // 将指定地址设为默认地址，并取消其他地址的默认状态。
  // 将指定地址设为默认地址，并取消其他地址的默认状态。
  async setDefault(userId: number, id: number) {
    const current = await this.find(userId, id)
    await this.prisma.$transaction([
      this.prisma.userAddresses.updateMany({
        where: { userId: BigInt(userId), deletedAt: null },
        data: { isDefault: 0 },
      }),
      this.prisma.userAddresses.update({
        where: { id: current.id },
        data: { isDefault: 1, updatedAt: new Date() },
      }),
    ])
    return this.list(userId)
  }
  // 软删除收货地址，删除默认地址后自动选择一个新默认地址。
  // 软删除收货地址，删除默认地址后自动选择一个新默认地址。
  async remove(userId: number, id: number) {
    const current = await this.find(userId, id)
    await this.prisma.userAddresses.update({
      where: { id: current.id },
      data: { deletedAt: new Date(), isDefault: 0, updatedAt: new Date() },
    })
    if (current.isDefault) {
      const next = await this.prisma.userAddresses.findFirst({
        where: { userId: BigInt(userId), deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      })
      if (next)
        await this.prisma.userAddresses.update({ where: { id: next.id }, data: { isDefault: 1 } })
    }
    return this.list(userId)
  }
  private async find(userId: number, id: number) {
    const row = await this.prisma.userAddresses.findFirst({
      where: { id: BigInt(id), userId: BigInt(userId), deletedAt: null },
    })
    if (!row) throw new NotFoundException('地址不存在')
    return row
  }
  private input(dto: AddressDto) {
    return {
      receiverName: dto.receiverName,
      receiverPhone: dto.receiverPhone,
      province: dto.province || '',
      city: dto.city || '',
      district: dto.district || '',
      detail: dto.detail,
    }
  }
  private format(row: any) {
    return {
      id: Number(row.id),
      receiverName: row.receiverName,
      receiverPhone: row.receiverPhone,
      province: row.province,
      city: row.city,
      district: row.district,
      detail: row.detail,
      isDefault: row.isDefault === 1,
    }
  }
}
