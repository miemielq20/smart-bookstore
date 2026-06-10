import {
  Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards,
} from "@nestjs/common"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { PrismaService } from "../prisma/prisma.service"
import { PermissionGroupService } from "./permission-group.service"

@Controller("permission-groups")
@UseGuards(JwtAuthGuard)
export class PermissionGroupController {
  constructor(
    private readonly svc: PermissionGroupService,
    private readonly prisma: PrismaService,
  ) {}

  /* GET /api/permission-groups/menu-tree — 全部菜单树 */
  @Get("menu-tree")
  async getMenuTree() {
    const menus = await this.prisma.menus.findMany({ orderBy: { sort: "asc" } })
    return buildTree(menus)
  }

  /* GET /api/permission-groups — 全部权限组 */
  @Get()
  findAll() {
    return this.svc.findAll()
  }

  /* POST /api/permission-groups — 新增 */
  @Post()
  create(@Body() body: { name: string; description?: string; menuIds: number[] }) {
    return this.svc.create(body)
  }

  /* PUT /api/permission-groups/:id — 更新 */
  @Put(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { name?: string; description?: string; menuIds?: number[] },
  ) {
    return this.svc.update(id, body)
  }

  /* GET /api/permission-groups/:id/menus — 已分配菜单ID */
  @Get(":id/menus")
  getMenus(@Param("id", ParseIntPipe) id: number) {
    return this.svc.getGroupMenus(id)
  }
}

/* 辅助：平铺菜单数组转树 */
function buildTree(list: any[]): any[] {
  const map = new Map<number, any>()
  const tree: any[] = []
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