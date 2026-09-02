import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AddressDto } from './dto/address.dto'

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}
  async list(userId: number) { const rows = await this.prisma.userAddresses.findMany({ where: { userId: BigInt(userId), deletedAt: null }, orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }] }); return rows.map(row => this.format(row)) }
  async create(userId: number, dto: AddressDto) { const count = await this.prisma.userAddresses.count({ where: { userId: BigInt(userId), deletedAt: null } }); const isDefault = dto.isDefault === 1 || count === 0 ? 1 : 0; return this.prisma.$transaction(async tx => { if (isDefault) await tx.userAddresses.updateMany({ where: { userId: BigInt(userId), deletedAt: null }, data: { isDefault: 0 } }); return this.format(await tx.userAddresses.create({ data: { ...this.input(dto), userId: BigInt(userId), isDefault } })) }) }
  async update(userId: number, id: number, dto: AddressDto) { const current = await this.find(userId, id); const isDefault = dto.isDefault === 1 ? 1 : current.isDefault; return this.prisma.$transaction(async tx => { if (isDefault) await tx.userAddresses.updateMany({ where: { userId: BigInt(userId), deletedAt: null }, data: { isDefault: 0 } }); return this.format(await tx.userAddresses.update({ where: { id: current.id }, data: { ...this.input(dto), isDefault, updatedAt: new Date() } })) }) }
  async setDefault(userId: number, id: number) { const current = await this.find(userId, id); await this.prisma.$transaction([this.prisma.userAddresses.updateMany({ where: { userId: BigInt(userId), deletedAt: null }, data: { isDefault: 0 } }), this.prisma.userAddresses.update({ where: { id: current.id }, data: { isDefault: 1, updatedAt: new Date() } })]); return this.list(userId) }
  async remove(userId: number, id: number) { const current = await this.find(userId, id); await this.prisma.userAddresses.update({ where: { id: current.id }, data: { deletedAt: new Date(), isDefault: 0, updatedAt: new Date() } }); if (current.isDefault) { const next = await this.prisma.userAddresses.findFirst({ where: { userId: BigInt(userId), deletedAt: null }, orderBy: { updatedAt: 'desc' } }); if (next) await this.prisma.userAddresses.update({ where: { id: next.id }, data: { isDefault: 1 } }) } return this.list(userId) }
  private async find(userId: number, id: number) { const row = await this.prisma.userAddresses.findFirst({ where: { id: BigInt(id), userId: BigInt(userId), deletedAt: null } }); if (!row) throw new NotFoundException('地址不存在'); return row }
  private input(dto: AddressDto) { return { receiverName: dto.receiverName, receiverPhone: dto.receiverPhone, province: dto.province || '', city: dto.city || '', district: dto.district || '', detail: dto.detail } }
  private format(row: any) { return { id: Number(row.id), receiverName: row.receiverName, receiverPhone: row.receiverPhone, province: row.province, city: row.city, district: row.district, detail: row.detail, isDefault: row.isDefault === 1 } }
}
