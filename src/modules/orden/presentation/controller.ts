import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { ordenServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import {
  createOrdenSchema,
  createOwnerOrdenSchema,
  listOrdenQuerySchema,
  listOwnerOrdenQuerySchema,
  payOrdenSchema,
  updateOrdenSchema,
} from './schemas'

export const ordenController = new Elysia({ name: '@app/modules/orden', prefix: '/ordenes' })
  .use(authRouter)
  .use(ordenServicePlugin)

  // ── MASTER_ADMIN routes ──────────────────────────────

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

  // ── OWNER self-service routes ────────────────────────
  // Must be defined before /:id to avoid param shadowing

  .get(
    '/mis-ordenes',
    async ({ companyId, query, ordenService, jsonPaginated }) => {
      const { data, total } = await ordenService.listMyOrdenes(
        companyId as string,
        query.page,
        query.pageSize,
        {
          ordenStatus: query.ordenStatus,
          cicloInicio: query.cicloInicio,
          cicloFin: query.cicloFin,
        },
      )
      return jsonPaginated(data, total, query.page, query.pageSize)
    },
    {
      query: listOwnerOrdenQuerySchema,
      withRole: UserRole.OWNER,
      detail: {
        tags: ['Ordenes'],
        summary: 'List my orders',
        description: "Returns paginated active orders for the authenticated owner's company.",
      },
    },
  )

  .post(
    '/mis-ordenes',
    async ({ companyId, body, ordenService, jsonOk }) => {
      const orden = await ordenService.createMyOrden(companyId as string, body)
      return jsonOk(orden, 'Orden created successfully')
    },
    {
      body: createOwnerOrdenSchema,
      withRole: UserRole.OWNER,
      detail: {
        tags: ['Ordenes'],
        summary: 'Create order for my subscription',
        description:
          'Creates a PENDIENTE order for the active subscription. Monto is derived from the plan price.',
      },
    },
  )

  .get(
    '/mis-ordenes/:id',
    async ({ companyId, params, ordenService, jsonOk }) => {
      const orden = await ordenService.getMyOrdenById(companyId as string, params.id)
      return jsonOk(orden)
    },
    {
      params: idParams,
      withRole: UserRole.OWNER,
      detail: {
        tags: ['Ordenes'],
        summary: 'Get my order detail',
        description: "Returns full detail of an order belonging to the owner's company.",
      },
    },
  )

  .patch(
    '/mis-ordenes/:id/pagar',
    async ({ companyId, params, body, ordenService, jsonOk }) => {
      const orden = await ordenService.payMyOrden(companyId as string, params.id, body)
      return jsonOk(orden, 'Order paid successfully')
    },
    {
      params: idParams,
      body: payOrdenSchema,
      withRole: UserRole.OWNER,
      detail: {
        tags: ['Ordenes'],
        summary: 'Pay an order',
        description:
          "Marks a PENDIENTE order as PAGADA and updates the subscription's next payment date.",
      },
    },
  )

  // ── MASTER_ADMIN detail/edit routes ──────────────────

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
