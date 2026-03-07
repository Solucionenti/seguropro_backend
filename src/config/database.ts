import { PrismaPg } from '@prisma/adapter-pg'
import { Elysia } from 'elysia'
import { PrismaClient } from '../../generated/prisma/client'
import { envConfig } from './env'

const adapter = new PrismaPg({ connectionString: envConfig.DATABASE_URL })

const prisma = new PrismaClient({
  adapter,
  omit: {
    user: { passwordHash: true },
  },
})

export { prisma }
export type AppPrismaClient = typeof prisma

export const dbPlugin = new Elysia({ name: '@app/config/db' }).decorate('db', prisma)
