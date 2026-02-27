import { Elysia } from 'elysia'
import { healthController } from '@/modules/health/presentation/controller'

export const v1 = new Elysia({ name: '@app/api/v1', prefix: '/api/v1' }).use(healthController)
