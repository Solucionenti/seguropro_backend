import { Elysia } from 'elysia'
import { aseguradoraController } from '@/modules/aseguradora/presentation/controller'
import { authController } from '@/modules/auth/presentation/controller'
import { healthController } from '@/modules/health/presentation/controller'
import { ordenController } from '@/modules/orden/presentation/controller'
import { planController } from '@/modules/plan/presentation/controller'
import { polizaController } from '@/modules/poliza/presentation/controller'
import { ramoController } from '@/modules/ramo/presentation/controller'
import { suscripcionController } from '@/modules/suscripcion/presentation/controller'
import { userController } from '@/modules/user/presentation/controller'

export const v1 = new Elysia({ name: '@app/api/v1', prefix: '/api/v1' })
  .use(healthController)
  .use(authController)
  .use(userController)
  .use(planController)
  .use(suscripcionController)
  .use(ordenController)
  .use(aseguradoraController)
  .use(ramoController)
  .use(polizaController)
