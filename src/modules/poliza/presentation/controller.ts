import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { polizaServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import {
  createPolizaSchema,
  polizaListQuery,
  updatePolizaKanbanSchema,
  updatePolizaSchema,
} from './schemas'

const POLIZA_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'fechaInicio',
  'fechaVencimiento',
  'numeroPoliza',
  'primaTotal',
] as const

export const polizaController = new Elysia({
  name: '@app/modules/poliza',
  prefix: '/polizas',
})
  .use(authRouter)
  .use(polizaServicePlugin)

  .get(
    '/',
    async ({ query, pageable, companyId, userId, userRole, polizaService, jsonOk }) => {
      const clienteUserId = userRole === UserRole.CLIENT ? userId : undefined
      const page = await polizaService.list(pageable, {
        companyId,
        clienteUserId,
        aseguradoraId: query.aseguradoraId,
        ramoId: query.ramoId,
        polizaStatus: query.polizaStatus,
        numeroPoliza: query.numeroPoliza,
      })
      return jsonOk(page)
    },
    {
      query: polizaListQuery,
      paginated: { sortFields: POLIZA_SORT_FIELDS },
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT, UserRole.CLIENT],
      detail: {
        tags: ['Polizas'],
        summary: 'List polizas',
        description:
          'Returns a paginated list of polizas for the authenticated company. CLIENT users only see their own polizas. Supports filtering by aseguradoraId, ramoId, polizaStatus and numeroPoliza.',
      },
    },
  )

  .post(
    '/',
    async ({ body, companyId, polizaService, jsonOk }) => {
      const poliza = await polizaService.create({
        companyId,
        aseguradoraId: body.aseguradoraId,
        ramoId: body.ramoId,
        clienteUserId: body.clienteUserId,
        numeroPoliza: body.numeroPoliza,
        fechaInicio: body.fechaInicio,
        fechaVencimiento: body.fechaVencimiento,
        primaNeta: body.primaNeta,
        primaTotal: body.primaTotal,
        polizaStatus: body.polizaStatus,
      })
      return jsonOk(poliza, 'Poliza created successfully')
    },
    {
      body: createPolizaSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Polizas'],
        summary: 'Create poliza',
        description:
          'Creates a poliza for the authenticated company. Validates that aseguradora, ramo and cliente belong to the same company. numeroPoliza must be unique within the company.',
      },
    },
  )

  .get(
    '/:id',
    async ({ params, companyId, userId, userRole, polizaService, jsonOk }) => {
      const clienteUserId = userRole === UserRole.CLIENT ? userId : undefined
      const poliza = await polizaService.getById(params.id, companyId, clienteUserId)
      return jsonOk(poliza)
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT, UserRole.CLIENT],
      detail: {
        tags: ['Polizas'],
        summary: 'Get poliza detail',
        description: 'Returns full details of a poliza. CLIENT can only access their own polizas.',
      },
    },
  )

  .patch(
    '/:id',
    async ({ params, body, companyId, polizaService, jsonOk }) => {
      const poliza = await polizaService.update(params.id, companyId, body)
      return jsonOk(poliza, 'Poliza updated successfully')
    },
    {
      params: idParams,
      body: updatePolizaSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Polizas'],
        summary: 'Update poliza',
        description:
          'Updates primaNeta, primaTotal, fechaVencimiento and/or polizaStatus. fechaVencimiento must be greater than or equal to fechaInicio.',
      },
    },
  )

  .patch(
    '/:id/kanban',
    async ({ params, body, companyId, polizaService, jsonOk }) => {
      const poliza = await polizaService.updateKanban(params.id, companyId, body)
      return jsonOk(poliza, 'Poliza Kanban column updated successfully')
    },
    {
      params: idParams,
      body: updatePolizaKanbanSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Polizas'],
        summary: 'Update only the Kanban column of a poliza',
        description:
          'Assigns or unassigns a poliza Kanban column without modifying any other poliza field.',
      },
    },
  )

  .delete(
    '/:id',
    async ({ params, companyId, polizaService, jsonOkNoData }) => {
      await polizaService.softDelete(params.id, companyId)
      return jsonOkNoData('Poliza deactivated successfully')
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Polizas'],
        summary: 'Deactivate poliza',
        description: 'Soft-deletes (deactivates) a poliza. History is preserved.',
      },
    },
  )
