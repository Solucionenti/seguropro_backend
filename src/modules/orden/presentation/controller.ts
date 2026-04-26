import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { ordenServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import { createOrdenSchema, listOrdenQuerySchema, updateOrdenSchema } from './schemas'

export const ordenController = new Elysia({ name: '@app/modules/orden', prefix: '/ordenes' })
  .use(authRouter)
  .use(ordenServicePlugin)

  .get(
    '/',
    async ({ query, ordenService, jsonPaginated }) => {
      const { data, total } = await ordenService.list(query.page, query.pageSize, {
        companyId: query.companyId,
        ordenStatus: query.ordenStatus,
        cicloInicio: query.cicloInicio,
        cicloFin: query.cicloFin,
      })
      return jsonPaginated(data, total, query.page, query.pageSize)
    },
    {
      query: listOrdenQuerySchema,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Ordenes'], summary: 'List orders' },
    },
  )

  .post(
    '/',
    async ({ body, ordenService, jsonOk }) => {
      const orden = await ordenService.create(body)
      return jsonOk(orden, 'Orden created successfully')
    },
    {
      body: createOrdenSchema,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Ordenes'], summary: 'Create order' },
    },
  )

  .get(
    '/:id',
    async ({ params, ordenService, jsonOk }) => {
      const orden = await ordenService.getById(params.id)
      return jsonOk(orden)
    },
    {
      params: idParams,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Ordenes'], summary: 'Get order detail' },
    },
  )

  .patch(
    '/:id',
    async ({ params, body, ordenService, jsonOk }) => {
      const orden = await ordenService.update(params.id, body)
      return jsonOk(orden, 'Orden updated successfully')
    },
    {
      params: idParams,
      body: updateOrdenSchema,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Ordenes'], summary: 'Update order' },
    },
  )

  .delete(
    '/:id',
    async ({ params, ordenService, jsonOkNoData }) => {
      await ordenService.deactivate(params.id)
      return jsonOkNoData('Orden deactivated successfully')
    },
    {
      params: idParams,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Ordenes'], summary: 'Deactivate order' },
    },
  )
