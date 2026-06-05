import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? 'mysql://root:root@localhost:3306/sm_sys',
  },
  migrations: {
    seed: 'ts-node --transpile-only ./src/prisma/seed.ts',
  },
})
