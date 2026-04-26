import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { suscripcionServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import {
  createSuscripcionSchema,
  listSuscripcionQuerySchema,
  updateSuscripcionSchema,
} from './schemas'

export const suscripcionController = new Elysia({
  name: '@app/modules/suscripcion',
  prefix: '/suscripciones',
})
  .use(authRouter)
  .use(suscripcionServicePlugin)

  .get(
    '/',
    async ({ query, suscripcionService, jsonPaginated }) => {
      const { data, total } = await suscripcionService.list(query.page, query.pageSize, {
        companyId: query.companyId,
        suscripcionStatus: query.suscripcionStatus,
        active: query.active,
      })
      return jsonPaginated(data, total, query.page, query.pageSize)
    },
    {
      query: listSuscripcionQuerySchema,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Suscripciones'], summary: 'List subscriptions' },
    },
  )

  .post(
    '/',
    async ({ body, suscripcionService, jsonOk }) => {
      const suscripcion = await suscripcionService.create(body)
      return jsonOk(suscripcion, 'Suscripcion created successfully')
    },
    {
      body: createSuscripcionSchema,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Suscripciones'], summary: 'Create subscription' },
    },
  )

  .get(
    '/:id',
    async ({ params, suscripcionService, jsonOk }) => {
      const suscripcion = await suscripcionService.getById(params.id)
      return jsonOk(suscripcion)
    },
    {
      params: idParams,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Suscripciones'], summary: 'Get subscription detail' },
    },
  )

  .patch(
    '/:id',
    async ({ params, body, suscripcionService, jsonOk }) => {
      const suscripcion = await suscripcionService.update(params.id, body)
      return jsonOk(suscripcion, 'Suscripcion updated successfully')
    },
    {
      params: idParams,
      body: updateSuscripcionSchema,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Suscripciones'], summary: 'Update subscription' },
    },
  )

  .delete(
    '/:id',
    async ({ params, suscripcionService, jsonOkNoData }) => {
      await suscripcionService.deactivate(params.id)
      return jsonOkNoData('Suscripcion deactivated successfully')
    },
    {
      params: idParams,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Suscripciones'], summary: 'Deactivate subscription' },
    },
  )
