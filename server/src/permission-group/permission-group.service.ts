import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class PermissionGroupService {
  constructor(private readonly prisma: PrismaService) {}

  /* 查询所有权限组(含成员数) */
  async findAll() {
    const groups = await this.prisma.permissionGroups.findMany({
      orderBy: { id: "asc" },
    })
    const result: Array<{
      id: number
      name: string
      description: string | null
      status: number
      createdAt: Date
      updatedAt: Date
      memberCount: number
    }> = []
    for (const g of groups) {
      const count = await this.prisma.users.count({
        where: { groupId: g.id, deletedAt: null, status: 1 },
      })
      result.push({ ...g, memberCount: count })
    }
    return result
  }

  /* 新增权限组 + 分配菜单 */
  async create(dto: { name: string; description?: string; menuIds: number[] }) {
    const group = await this.prisma.permissionGroups.create({
      data: { name: dto.name, description: dto.description },
    })
    if (dto.menuIds.length > 0) {
      await this.prisma.groupMenus.createMany({
        data: dto.menuIds.map((menuId) => ({ groupId: group.id, menuId })),
      })
    }
    return group
  }

  /* 更新权限组（名称、描述、菜单分配） */
  async update(id: number, dto: { name?: string; description?: string; menuIds?: number[] }) {
    const group = await this.prisma.permissionGroups.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    })
    if (dto.menuIds !== undefined) {
      await this.prisma.groupMenus.deleteMany({ where: { groupId: id } })
      if (dto.menuIds.length > 0) {
        await this.prisma.groupMenus.createMany({
          data: dto.menuIds.map((menuId) => ({ groupId: id, menuId })),
        })
      }
    }
    return group
  }

  /* 获取某个权限组已分配的菜单 ID 列表 */
  async getGroupMenus(id: number) {
    const rows = await this.prisma.groupMenus.findMany({
      where: { groupId: id },
      select: { menuId: true },
    })
    return rows.map((r) => r.menuId)
  }
}