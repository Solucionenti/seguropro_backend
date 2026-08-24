import { Elysia } from 'elysia'
import { archivoPolizaController } from '@/modules/archivo-poliza/presentation/controller'
import { fileController } from '@/modules/archivo-poliza/presentation/file-controller'
import { archivoSiniestroController } from '@/modules/archivo-siniestro/presentation/controller'
import { aseguradoraController } from '@/modules/aseguradora/presentation/controller'
import { authController } from '@/modules/auth/presentation/controller'
import { columnaKanbanController } from '@/modules/columna-kanban/presentation/controller'
import { companyController } from '@/modules/company/presentation/controller'
import { glosarioController } from '@/modules/glosario/presentation/controller'
import { healthController } from '@/modules/health/presentation/controller'
import { jobController } from '@/modules/notificacion/presentation/controller'
import { ordenController } from '@/modules/orden/presentation/controller'
import { planController } from '@/modules/plan/presentation/controller'
import { polizaController } from '@/modules/poliza/presentation/controller'
import { ramoController } from '@/modules/ramo/presentation/controller'
import { siniestroController } from '@/modules/siniestro/presentation/controller'
import { suscripcionController } from '@/modules/suscripcion/presentation/controller'
import { tareaKanbanController } from '@/modules/tarea-kanban/presentation/controller'
import { companyUserController } from '@/modules/user/presentation/company-user-controller'
import { userController } from '@/modules/user/presentation/controller'

export const v1 = new Elysia({ name: '@app/api/v1', prefix: '/api/v1' })
  .use(healthController)
  .use(authController)
  .use(userController)
  .use(companyUserController)
  .use(companyController)
  .use(planController)
  .use(suscripcionController)
  .use(ordenController)
  .use(aseguradoraController)
  .use(columnaKanbanController)
  .use(tareaKanbanController)
  .use(ramoController)
  .use(glosarioController)
  .use(polizaController)
  .use(siniestroController)
  .use(archivoPolizaController)
  .use(archivoSiniestroController)
  .use(fileController)
  .use(jobController)
