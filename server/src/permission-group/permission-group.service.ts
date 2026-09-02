import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdatePermissionDto } from './dto/update-permission.dto'
import { CreatePermissionDto } from './dto/create-permission.dto'
import { PermissionGroupEntity } from './entities/permission-group.entity'
import { MenuEntity } from './entities/menu.entity'

@Injectable()
export class PermissionGroupService {
  constructor(private readonly prisma: PrismaService) {}

  /* 查询所有权限组(含成员数) */
  async findAll() {
    const groups = await this.prisma.permissionGroups.findMany({
      orderBy: { id: 'asc' },
    })

    const result: PermissionGroupEntity[] = []

    for (const g of groups) {
      const count = await this.prisma.users.count({
        where: { groupId: g.id, deletedAt: null, status: 1 },
      })
      result.push({
        id: Number(g.id),
        name: g.name,
        description: g.description,
        status: g.status,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        memberCount: count,
      })
    }
    return result
  }

  /* 新增权限组 + 分配菜单 */
  async create(dto: CreatePermissionDto) {
    const group = await this.prisma.permissionGroups.create({
      data: { name: dto.name!, description: dto.description },
    })
    if (dto.menuIds && dto.menuIds.length > 0) {
      await this.prisma.groupMenus.createMany({
        data: dto.menuIds.map((menuId) => ({ groupId: group.id, menuId })),
      })
    }
    return {
      id: Number(group.id),
      name: group.name,
      description: group.description,
      status: group.status,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      memberCount: 0,
    }
  }

  /* 更新权限组（名称、描述、菜单分配） */
  async update(id: number, dto: UpdatePermissionDto) {
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

  // 获取菜单树
  async getMenuTree() {
    const menus = await this.prisma.menus.findMany({ orderBy: { sort: 'asc' } })
    const mapped = menus.map(
      (m) =>
        ({
          id: Number(m.id),
          parentId: Number(m.parentId),
          name: m.name,
          path: m.path,
          icon: m.icon,
          component: m.component,
          sort: m.sort,
          status: m.status,
          visible: m.visible,
          permissionCode: m.permissionCode,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        }) as MenuEntity,
    )
    return buildTree(mapped)
  }
}

/* 辅助：平铺菜单数组转树 */
function buildTree(list: MenuEntity[]): MenuEntity[] {
  const map = new Map<number, MenuEntity & { children: MenuEntity[] }>()
  const tree: (MenuEntity & { children: MenuEntity[] })[] = []

  for (const item of list) {
    map.set(item.id, { ...item, children: [] })
  }
  for (const item of list) {
    const node = map.get(item.id)!
    if (item.parentId === 0 || !map.has(item.parentId!)) {
      tree.push(node)
    } else {
      map.get(item.parentId!)!.children.push(node)
    }
  }
  return tree
}
