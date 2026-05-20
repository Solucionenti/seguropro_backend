import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { ramoServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import { createRamoSchema, ramoListQuery, updateRamoSchema } from './schemas'

const RAMO_SORT_FIELDS = ['createdAt', 'updatedAt', 'nombre'] as const

export const ramoController = new Elysia({
  name: '@app/modules/ramo',
  prefix: '/ramos',
})
  .use(authRouter)
  .use(ramoServicePlugin)

  .get(
    '/',
    async ({ query, pageable, companyId, ramoService, jsonOk }) => {
      const page = await ramoService.list(pageable, {
        companyId,
        nombre: query.nombre,
      })
      return jsonOk(page)
    },
    {
      query: ramoListQuery,
      paginated: { sortFields: RAMO_SORT_FIELDS },
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Ramos'],
        summary: 'List ramos',
        description:
          'Returns a paginated list of ramos for the authenticated company. Supports search by nombre.',
      },
    },
  )

  .post(
    '/',
    async ({ body, companyId, ramoService, jsonOk }) => {
      const ramo = await ramoService.create({
        companyId,
        nombre: body.nombre,
        descripcion: body.descripcion,
      })
      return jsonOk(ramo, 'Ramo created successfully')
    },
    {
      body: createRamoSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Ramos'],
        summary: 'Create ramo',
        description:
          'Creates a new ramo for the company. Nombre must be unique within the company.',
      },
    },
  )

  .get(
    '/:id',
    async ({ params, companyId, ramoService, jsonOk }) => {
      const ramo = await ramoService.getById(params.id, companyId)
      return jsonOk(ramo)
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Ramos'],
        summary: 'Get ramo detail',
        description: 'Returns full details of a ramo. Must belong to the authenticated company.',
      },
    },
  )

  .patch(
    '/:id',
    async ({ params, body, companyId, ramoService, jsonOk }) => {
      const ramo = await ramoService.update(params.id, companyId, body)
      return jsonOk(ramo, 'Ramo updated successfully')
    },
    {
      params: idParams,
      body: updateRamoSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Ramos'],
        summary: 'Update ramo',
        description: 'Updates nombre and/or descripcion of a ramo.',
      },
    },
  )

  .delete(
    '/:id',
    async ({ params, companyId, ramoService, jsonOkNoData }) => {
      await ramoService.softDelete(params.id, companyId)
      return jsonOkNoData('Ramo deactivated successfully')
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Ramos'],
        summary: 'Deactivate ramo',
        description: 'Soft-deletes (deactivates) a ramo. Associated polizas remain unaffected.',
      },
    },
  )
