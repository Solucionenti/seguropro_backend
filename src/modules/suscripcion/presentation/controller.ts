import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { suscripcionServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import {
  createOwnerSuscripcionSchema,
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

  // ── MASTER_ADMIN routes ──────────────────────────────

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

  // ── OWNER self-service routes ─────────────────────────
  // Must be defined before /:id to avoid param shadowing

  .get(
    '/mi-suscripcion',
    async ({ companyId, suscripcionService, jsonOk, jsonOkNoData }) => {
      const suscripcion = await suscripcionService.getMySubscription(companyId as string)
      if (!suscripcion) {
        return jsonOkNoData('No active subscription found')
      }
      return jsonOk(suscripcion)
    },
    {
      withRole: UserRole.OWNER,
      detail: {
        tags: ['Suscripciones'],
        summary: 'Get my active subscription',
        description: "Returns the active subscription for the authenticated owner's company.",
      },
    },
  )

  .post(
    '/mi-suscripcion',
    async ({ companyId, body, suscripcionService, jsonOk }) => {
      const suscripcion = await suscripcionService.createMySubscription(companyId as string, body)
      return jsonOk(suscripcion, 'Subscription created successfully')
    },
    {
      body: createOwnerSuscripcionSchema,
      withRole: UserRole.OWNER,
      detail: {
        tags: ['Suscripciones'],
        summary: 'Subscribe to a plan',
        description:
          "Creates a new subscription for the owner's company. Fails if an active subscription already exists.",
      },
    },
  )

  .delete(
    '/mi-suscripcion',
    async ({ companyId, suscripcionService, jsonOkNoData }) => {
      await suscripcionService.cancelMySubscription(companyId as string)
      return jsonOkNoData('Subscription cancelled successfully')
    },
    {
      withRole: UserRole.OWNER,
      detail: {
        tags: ['Suscripciones'],
        summary: 'Cancel my subscription',
        description:
          "Cancels the active subscription for the owner's company. Sets status to CANCELADA and disables automatic renewal.",
      },
    },
  )

  // ── MASTER_ADMIN detail/edit routes ──────────────────

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
