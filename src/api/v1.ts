import { Elysia } from 'elysia'
import { authController } from '@/modules/auth/presentation/controller'
import { healthController } from '@/modules/health/presentation/controller'
import { userController } from '@/modules/user/presentation/controller'

export const v1 = new Elysia({ name: '@app/api/v1', prefix: '/api/v1' })
  .use(healthController)
  .use(authController)
  .use(userController)
