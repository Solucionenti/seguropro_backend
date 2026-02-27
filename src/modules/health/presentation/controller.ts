import { Elysia } from 'elysia'
import { prisma } from '@/config/database'
import { baseController } from '@/shared/base-controller'
import { HealthService } from '../application/service'
import { PrismaHealthRepository } from '../infrastructure/prisma-repo'

const healthRepo = new PrismaHealthRepository(prisma)
const healthService = new HealthService(healthRepo)

export const healthController = new Elysia({
  name: '@app/modules/health',
  prefix: '/health',
})
  .use(baseController)
  .get(
    '/',
    async (ctx) => {
      const status = await healthService.getStatus()
      return ctx.jsonOk(status)
    },
    {
      detail: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns current server and database health status',
      },
    },
  )
