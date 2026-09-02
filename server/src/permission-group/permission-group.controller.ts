import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PrismaService } from '../prisma/prisma.service'
import { PermissionGroupService } from './permission-group.service'
import { CreatePermissionDto } from './dto/create-permission.dto'
import { UpdatePermissionDto } from './dto/update-permission.dto'

@Controller('permission-groups')
@UseGuards(JwtAuthGuard)
export class PermissionGroupController {
  constructor(
    private readonly permissionGroupService: PermissionGroupService,
    private readonly prisma: PrismaService,
  ) {}

  /* GET /api/permission-groups/menu-tree — 全部菜单树 */
  @Get('menu-tree')
  getMenuTree() {
    return this.permissionGroupService.getMenuTree()
  }

  /* GET /api/permission-groups — 全部权限组 */
  @Get()
  findAll() {
    return this.permissionGroupService.findAll()
  }

  /* POST /api/permission-groups — 新增 */
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionGroupService.create(createPermissionDto)
  }

  /* PUT /api/permission-groups/:id — 更新 */
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updataPermissionDto: UpdatePermissionDto) {
    return this.permissionGroupService.update(id, updataPermissionDto)
  }

  /* GET /api/permission-groups/:id/menus — 已分配菜单ID */
  @Get(':id/menus')
  getMenus(@Param('id', ParseIntPipe) id: number) {
    return this.permissionGroupService.getGroupMenus(id)
  }
}
