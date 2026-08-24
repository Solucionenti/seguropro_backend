import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { hitoServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import {
  createHitoSchema,
  hitoListQuery,
  hitoScopeParams,
  siniestroScopeParams,
  updateHitoSchema,
} from './schemas'

const HITO_SORT_FIELDS = ['createdAt', 'updatedAt', 'fechaLimite', 'tarea'] as const

export const hitoController = new Elysia({
  name: '@app/modules/hito-siniestro',
  prefix: '/siniestros/:id/hitos',
})
  .use(authRouter)
  .use(hitoServicePlugin)

  .get(
    '/',
    async ({ params, query, pageable, companyId, userId, userRole, hitoService, jsonOk }) => {
      const clienteUserId = userRole === UserRole.CLIENT ? userId : undefined
      const page = await hitoService.list(
        { siniestroId: params.id, companyId, clienteUserId },
        pageable,
        { hitoStatus: query.hitoStatus, asignadoAUserId: query.asignadoAUserId },
      )
      return jsonOk(page)
    },
    {
      params: siniestroScopeParams,
      query: hitoListQuery,
      paginated: { sortFields: HITO_SORT_FIELDS },
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT, UserRole.CLIENT],
      detail: {
        tags: ['Hitos de Siniestro'],
        summary: 'List siniestro milestones',
        description:
          'Returns a paginated list of the milestones of a siniestro. Supports filtering by hitoStatus and asignadoAUserId. CLIENT can only read milestones of their own siniestros.',
      },
    },
  )

  .post(
    '/',
    async ({ params, body, companyId, hitoService, jsonOk }) => {
      const hito = await hitoService.create({ siniestroId: params.id, companyId }, body)
      return jsonOk(hito, 'Hito created successfully')
    },
    {
      params: siniestroScopeParams,
      body: createHitoSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Hitos de Siniestro'],
        summary: 'Create a siniestro milestone',
        description:
          'Creates a milestone for a siniestro of the authenticated company. `fechaLimite` is required and cannot be in the past. `asignadoAUserId` is optional but must be an active OWNER or AGENT of the same company. `alerta` defaults to true and is what the notification job watches.',
      },
    },
  )

  .get(
    '/:hitoId',
    async ({ params, companyId, userId, userRole, hitoService, jsonOk }) => {
      const clienteUserId = userRole === UserRole.CLIENT ? userId : undefined
      const hito = await hitoService.getById(params.hitoId, {
        siniestroId: params.id,
        companyId,
        clienteUserId,
      })
      return jsonOk(hito)
    },
    {
      params: hitoScopeParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT, UserRole.CLIENT],
      detail: {
        tags: ['Hitos de Siniestro'],
        summary: 'Get milestone detail',
        description:
          'Returns one milestone with its assignee. CLIENT can only read milestones of their own siniestros.',
      },
    },
  )

  .patch(
    '/:hitoId',
    async ({ params, body, companyId, hitoService, jsonOk }) => {
      const hito = await hitoService.update(
        params.hitoId,
        { siniestroId: params.id, companyId },
        body,
      )
      return jsonOk(hito, 'Hito updated successfully')
    },
    {
      params: hitoScopeParams,
      body: updateHitoSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Hitos de Siniestro'],
        summary: 'Update a milestone',
        description:
          'Updates tarea, descripcion, fechaLimite, alerta, hitoStatus and/or asignadoAUserId. Send `asignadoAUserId: null` to unassign. `siniestroId` is immutable.',
      },
    },
  )

  .delete(
    '/:hitoId',
    async ({ params, companyId, hitoService, jsonOkNoData }) => {
      await hitoService.softDelete(params.hitoId, { siniestroId: params.id, companyId })
      return jsonOkNoData('Hito deactivated successfully')
    },
    {
      params: hitoScopeParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Hitos de Siniestro'],
        summary: 'Deactivate a milestone',
        description:
          'Soft-deletes the milestone. It stops appearing in the listing and in the alert panel, and the history is preserved.',
      },
    },
  )
