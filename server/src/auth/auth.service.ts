import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { PasswordLoginDto } from '../common/dto/login.dto'
import { scrypt } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const PASSWORD_SALT = 'sm_sys_salt_2026'

async function verifyPassword(input: string, storedHash: string): Promise<boolean> {
  const buf = (await scryptAsync(input, PASSWORD_SALT, 64)) as Buffer
  return buf.toString('hex') === storedHash
}

export async function hashPassword(password: string): Promise<string> {
  const buf = (await scryptAsync(password, PASSWORD_SALT, 64)) as Buffer
  return buf.toString('hex')
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async passwordLogin(dto: PasswordLoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        username: dto.username,
        deletedAt: null,
        status: 1,
      },
    })

    if (!user || !user.password ||!dto.password) {
      throw new UnauthorizedException('账号或密码错误')
    }

    const pwdMatch = await verifyPassword(dto.password, user.password)
    if (!pwdMatch) {
      throw new UnauthorizedException('账号或密码错误')
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return this.generateToken(user)
  }

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