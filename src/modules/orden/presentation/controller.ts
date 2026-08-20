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

const ORDEN_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'cicloInicio',
  'cicloFin',
  'pagadaEn',
  'monto',
] as const

export const ordenController = new Elysia({ name: '@app/modules/orden', prefix: '/ordenes' })
  .use(authRouter)
  .use(ordenServicePlugin)

  // ── MASTER_ADMIN routes ──────────────────────────────

  .get(
    '/',
    async ({ query, pageable, ordenService, jsonOk }) => {
      const page = await ordenService.list(pageable, {
        companyId: query.companyId,
        ordenStatus: query.ordenStatus,
        cicloInicio: query.cicloInicio,
        cicloFin: query.cicloFin,
      })
      return jsonOk(page)
    },
    {
      query: listOrdenQuerySchema,
      paginated: { sortFields: ORDEN_SORT_FIELDS },
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
  // registered before /:id so the static route wins

  .get(
    '/mis-ordenes',
    async ({ companyId, query, pageable, ordenService, jsonOk }) => {
      const page = await ordenService.listMyOrdenes(companyId, pageable, {
        ordenStatus: query.ordenStatus,
        cicloInicio: query.cicloInicio,
        cicloFin: query.cicloFin,
      })
      return jsonOk(page)
    },
    {
      query: listOwnerOrdenQuerySchema,
      paginated: { sortFields: ORDEN_SORT_FIELDS },
      requireCompany: true,
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
      const orden = await ordenService.createMyOrden(companyId, body)
      return jsonOk(orden, 'Orden created successfully')
    },
    {
      body: createOwnerOrdenSchema,
      requireCompany: true,
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
      const orden = await ordenService.getMyOrdenById(companyId, params.id)
      return jsonOk(orden)
    },
    {
      params: idParams,
      requireCompany: true,
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
      const orden = await ordenService.payMyOrden(companyId, params.id, body)
      return jsonOk(orden, 'Order paid successfully')
    },
    {
      params: idParams,
      body: payOrdenSchema,
      requireCompany: true,
      withRole: UserRole.OWNER,
      detail: {
        tags: ['Ordenes'],
        summary: 'Pay an order',
        description:
          "Marks a PENDIENTE order as PAGADA and updates the subscription's next payment date.",
      },
    },
  )

  .patch(
    '/mis-ordenes/:id/pagar-primera',
    async ({ companyId, params, body, ordenService, jsonOk }) => {
      const orden = await ordenService.payMyFirstOrden(companyId, params.id, body)
      return jsonOk(orden, 'Order paid successfully')
    },
    {
      params: idParams,
      body: payOrdenSchema,
      requireCompany: true,
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
