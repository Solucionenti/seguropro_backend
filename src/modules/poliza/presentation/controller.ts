import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { polizaServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import { createPolizaSchema, polizaListQuery, updatePolizaSchema } from './schemas'

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

  // registered before /:id so the static route wins
  .get(
    '/mis-polizas',
    async ({ query, pageable, companyId, userId, polizaService, jsonOk }) => {
      const page = await polizaService.list(pageable, {
        companyId,
        clienteUserId: userId,
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
      withRole: UserRole.CLIENT,
      detail: {
        tags: ['Polizas'],
        summary: 'List my polizas (CLIENT)',
        description:
          'Returns a paginated list of the authenticated CLIENT own polizas. The clienteUserId filter comes from the JWT, never from the query string.',
      },
    },
  )

  .get(
    '/mis-polizas/:id',
    async ({ params, companyId, userId, polizaService, jsonOk }) => {
      const poliza = await polizaService.getById(params.id, companyId, userId)
      return jsonOk(poliza)
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: UserRole.CLIENT,
      detail: {
        tags: ['Polizas'],
        summary: 'Get my poliza detail (CLIENT)',
        description:
          'Returns full details of one of the authenticated CLIENT own polizas. Returns 404 when the poliza belongs to another cliente.',
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

  .post(
    '/:id/renovar',
    async ({ params, companyId, userId, polizaService, jsonOk }) => {
      const renovacion = await polizaService.crearRenovacion({
        polizaOrigenId: params.id,
        companyId,
        creadoPorUserId: userId,
      })
      return jsonOk(renovacion, 'Renovacion created successfully')
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Polizas'],
        summary: 'Create a renewal from an existing poliza',
        description:
          'Creates a new poliza in COTIZACION status linked to the origin through polizaAnteriorId, copying aseguradora, ramo, cliente and both primas. numeroPoliza, fechaInicio and fechaVencimiento start empty and must be filled before the quote can leave COTIZACION. A poliza can only be renewed once while its renewal is active.',
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
