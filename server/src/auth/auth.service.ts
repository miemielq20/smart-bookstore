import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { PasswordLoginDto } from '../common/dto/login.dto'
import { CaptchaService } from '../captcha/captcha.service'
import { scrypt } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const PASSWORD_SALT = 'sm_sys_salt_2026'

/* ====== 密码工具函数 ====== */

async function verifyPassword(input: string, storedHash: string): Promise<boolean> {
  const buf = (await scryptAsync(input, PASSWORD_SALT, 64)) as Buffer
  return buf.toString('hex') === storedHash
}

export async function hashPassword(password: string): Promise<string> {
  const buf = (await scryptAsync(password, PASSWORD_SALT, 64)) as Buffer
  return buf.toString('hex')
}

/* ====== Auth Service ====== */

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly captchaService: CaptchaService,
  ) {}

  /* 密码登录 */
  async passwordLogin(dto: PasswordLoginDto) {
    const user = await this.prisma.users.findFirst({
      where: { username: dto.username, deletedAt: null, status: 1 },
    })

    if (!user || !user.password || !dto.password) {
      throw new UnauthorizedException('账号或密码错误')
    }

    const pwdMatch = await verifyPassword(dto.password, user.password)
    if (!pwdMatch) {
      throw new UnauthorizedException('账号或密码错误')
    }

    if (dto.captcha && dto.captchaId) {
      const valid = await this.captchaService.validate(dto.captchaId, dto.captcha)
      if (!valid) throw new UnauthorizedException('验证码错误')
    }

    await this.prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return this.generateToken(user)
  }

  /* 获取用户菜单树（按 group_id） */
  async getUserMenus(groupId: number | null) {
    if (!groupId) return []

    // 1. 查权限组分配的菜单 ID
    const rows = await this.prisma.groupMenus.findMany({
      where: { groupId },
      select: { menuId: true },
    })
    const menuIds = rows.map((r) => r.menuId)

    // 2. 查菜单详情
    const menus = await this.prisma.menus.findMany({
      where: { id: { in: menuIds } },
    })

    // 3. 查按钮 ID
    const btnRows = await this.prisma.groupButtons.findMany({
      where: { groupId },
      select: { buttonId: true },
    })
    const buttonIds = btnRows.map((r) => r.buttonId)

    // 4. 查按钮详情
    const buttons = await this.prisma.menuButtons.findMany({
      where: { id: { in: buttonIds } },
    })

    // 5. 构建按钮映射：menuId → buttons[]
    const btnMap = new Map<number, { name: string; permissionCode: string }[]>()
    for (const b of buttons) {
      if (!btnMap.has(b.menuId)) btnMap.set(b.menuId, [])
      btnMap.get(b.menuId)!.push({ name: b.name, permissionCode: b.permissionCode })
    }

    // 6. 构建菜单节点
    const menuMap = new Map<number, any>()
    for (const m of menus) {
      menuMap.set(m.id, {
        id: m.id,
        parentId: m.parentId,
        name: m.name,
        path: m.path,
        component: m.component,
        icon: m.icon, 
        permissionCode: m.permissionCode,
        sort: m.sort,
        visible: m.visible,
        buttons: btnMap.get(m.id) ?? [],
      })
    }

    // 7. 构建树
    const nodes = Array.from(menuMap.values())
    const tree: any[] = []
    const nodeMap = new Map<number, any>()
    for (const n of nodes) nodeMap.set(n.id, { ...n, children: [] })
    for (const n of nodes) {
      const t = nodeMap.get(n.id)!
      if (n.parentId === 0 || !nodeMap.has(n.parentId)) {
        tree.push(t)
      } else {
        nodeMap.get(n.parentId)!.children.push(t)
      }
    }

    // 8. 递归排序
    const sortDeep = (arr: any[]) => {
      arr.sort((a, b) => a.sort - b.sort)
      arr.forEach((n) => sortDeep(n.children))
    }
    sortDeep(tree)

    return tree
  }

  /* 生成 JWT */
  private generateToken(user: { id: bigint; username: string; groupId: number | null }) {
    const payload = {
      sub: Number(user.id),
      username: user.username,
      groupId: user.groupId,
    }
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: Number(user.id),
        username: user.username,
        groupId: user.groupId,
      },
    }
  }
}
