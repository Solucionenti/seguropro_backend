import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { aseguradoraServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import { aseguradoraListQuery, createAseguradoraSchema, updateAseguradoraSchema } from './schemas'

export const aseguradoraController = new Elysia({
  name: '@app/modules/aseguradora',
  prefix: '/aseguradoras',
})
  .use(authRouter)
  .use(aseguradoraServicePlugin)

  .get(
    '/',
    async ({ query, companyId, aseguradoraService, jsonPaginated }) => {
      const { data, total } = await aseguradoraService.list({
        companyId,
        page: query.page,
        pageSize: query.pageSize,
        nombre: query.nombre,
      })
      return jsonPaginated(data, total, query.page, query.pageSize)
    },
    {
      query: aseguradoraListQuery,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Aseguradoras'],
        summary: 'List aseguradoras',
        description:
          'Returns a paginated list of aseguradoras for the authenticated company. Supports search by nombre.',
      },
    },
  )

  .post(
    '/',
    async ({ body, companyId, aseguradoraService, jsonOk }) => {
      const aseguradora = await aseguradoraService.create({
        companyId,
        nombre: body.nombre,
        descripcion: body.descripcion,
      })
      return jsonOk(aseguradora, 'Aseguradora created successfully')
    },
    {
      body: createAseguradoraSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Aseguradoras'],
        summary: 'Create aseguradora',
        description:
          'Creates a new aseguradora for the company. Nombre must be unique within the company.',
      },
    },
  )

  .get(
    '/:id',
    async ({ params, companyId, aseguradoraService, jsonOk }) => {
      const aseguradora = await aseguradoraService.getById(params.id, companyId)
      return jsonOk(aseguradora)
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Aseguradoras'],
        summary: 'Get aseguradora detail',
        description:
          'Returns full details of an aseguradora. Must belong to the authenticated company.',
      },
    },
  )

  .patch(
    '/:id',
    async ({ params, body, companyId, aseguradoraService, jsonOk }) => {
      const aseguradora = await aseguradoraService.update(params.id, companyId, body)
      return jsonOk(aseguradora, 'Aseguradora updated successfully')
    },
    {
      params: idParams,
      body: updateAseguradoraSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Aseguradoras'],
        summary: 'Update aseguradora',
        description: 'Updates nombre and/or descripcion of an aseguradora.',
      },
    },
  )

  .delete(
    '/:id',
    async ({ params, companyId, aseguradoraService, jsonOkNoData }) => {
      await aseguradoraService.softDelete(params.id, companyId)
      return jsonOkNoData('Aseguradora deactivated successfully')
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Aseguradoras'],
        summary: 'Deactivate aseguradora',
        description:
          'Soft-deletes (deactivates) an aseguradora. Associated policies remain unaffected.',
      },
    },
  )
