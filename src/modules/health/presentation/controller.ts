import { Elysia } from 'elysia'
import { healthServicePlugin } from '@/config/services'
import { publicRouter } from '@/shared/routers/public-router'

export const healthController = new Elysia({
  name: '@app/modules/health',
  prefix: '/health',
})
  .use(publicRouter)
  .use(healthServicePlugin)
  .get(
    '/',
    async ({ healthService, jsonOk }) => {
      const status = await healthService.getStatus()
      return jsonOk(status)
    },
    {
      detail: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns current server and database health status',
      },
    },
  )
