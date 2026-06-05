import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
    constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined')
    }
    console.log('DATABASE_URL:', process.env.DATABASE_URL)
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string)
    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}