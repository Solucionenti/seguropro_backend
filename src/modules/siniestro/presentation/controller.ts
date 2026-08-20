import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { siniestroServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import { createSiniestroSchema, siniestroListQuery, updateSiniestroSchema } from './schemas'

const SINIESTRO_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'fechaEvento',
  'montoEstimado',
  'montoPagado',
] as const

export const siniestroController = new Elysia({
  name: '@app/modules/siniestro',
  prefix: '/siniestros',
})
  .use(authRouter)
  .use(siniestroServicePlugin)

  .get(
    '/',
    async ({ query, pageable, companyId, userId, userRole, siniestroService, jsonOk }) => {
      const clienteUserId = userRole === UserRole.CLIENT ? userId : undefined
      const page = await siniestroService.list(pageable, {
        companyId,
        clienteUserId,
        polizaId: query.polizaId,
        siniestroStatus: query.siniestroStatus,
        tipoSiniestro: query.tipoSiniestro,
      })
      return jsonOk(page)
    },
    {
      query: siniestroListQuery,
      paginated: { sortFields: SINIESTRO_SORT_FIELDS },
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT, UserRole.CLIENT],
      detail: {
        tags: ['Siniestros'],
        summary: 'List siniestros',
        description:
          'Returns a paginated list of siniestros for the authenticated company. CLIENT users only see siniestros linked to their own polizas. Supports filtering by polizaId, siniestroStatus and tipoSiniestro.',
      },
    },
  )

  .post(
    '/',
    async ({ body, companyId, userId, siniestroService, jsonOk }) => {
      const siniestro = await siniestroService.create({
        companyId,
        polizaId: body.polizaId,
        creadoPorUserId: userId,
        fechaEvento: body.fechaEvento,
        tipoSiniestro: body.tipoSiniestro,
        descripcion: body.descripcion,
        ajustador: body.ajustador,
        montoEstimado: body.montoEstimado,
        siniestroStatus: body.siniestroStatus,
      })
      return jsonOk(siniestro, 'Siniestro created successfully')
    },
    {
      body: createSiniestroSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Siniestros'],
        summary: 'Create siniestro',
        description:
          'Creates a siniestro for a poliza of the authenticated company. clienteUserId is derived from the poliza, never taken from the request. fechaEvento must fall within the poliza coverage period and cannot be in the future.',
      },
    },
  )

  .get(
    '/:id',
    async ({ params, companyId, userId, userRole, siniestroService, jsonOk }) => {
      const clienteUserId = userRole === UserRole.CLIENT ? userId : undefined
      const siniestro = await siniestroService.getById(params.id, companyId, clienteUserId)
      return jsonOk(siniestro)
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT, UserRole.CLIENT],
      detail: {
        tags: ['Siniestros'],
        summary: 'Get siniestro detail',
        description:
          'Returns full details of a siniestro. CLIENT can only access siniestros linked to their own polizas.',
      },
    },
  )

  .patch(
    '/:id',
    async ({ params, body, companyId, siniestroService, jsonOk }) => {
      const siniestro = await siniestroService.update(params.id, companyId, body)
      return jsonOk(siniestro, 'Siniestro updated successfully')
    },
    {
      params: idParams,
      body: updateSiniestroSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Siniestros'],
        summary: 'Update siniestro',
        description:
          'Updates tipoSiniestro, descripcion, ajustador, montoEstimado, montoPagado and/or siniestroStatus. companyId, polizaId and clienteUserId cannot be changed.',
      },
    },
  )

  .delete(
    '/:id',
    async ({ params, companyId, siniestroService, jsonOkNoData }) => {
      await siniestroService.softDelete(params.id, companyId)
      return jsonOkNoData('Siniestro deactivated successfully')
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Siniestros'],
        summary: 'Deactivate siniestro',
        description:
          'Soft-deletes (deactivates) a siniestro. Associated files and history are preserved.',
      },
    },
  )
