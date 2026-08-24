import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { glosarioServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import { createGlosarioSchema, glosarioListQuery, updateGlosarioSchema } from './schemas'

const GLOSARIO_SORT_FIELDS = ['createdAt', 'updatedAt', 'titulo'] as const

export const glosarioController = new Elysia({
  name: '@app/modules/glosario',
  prefix: '/glosarios',
})
  .use(authRouter)
  .use(glosarioServicePlugin)

  .get(
    '/',
    async ({ query, pageable, companyId, glosarioService, jsonOk }) => {
      const page = await glosarioService.list(pageable, {
        companyId,
        titulo: query.titulo,
      })
      return jsonOk(page)
    },
    {
      query: glosarioListQuery,
      paginated: { sortFields: GLOSARIO_SORT_FIELDS },
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT, UserRole.CLIENT],
      detail: {
        tags: ['Glosario'],
        summary: 'List glossary terms',
        description:
          'Returns a paginated list of the glossary terms of the authenticated company. Supports search by titulo. CLIENT has read-only access.',
      },
    },
  )

  .post(
    '/',
    async ({ body, companyId, glosarioService, jsonOk }) => {
      const glosario = await glosarioService.create({ companyId, ...body })
      return jsonOk(glosario, 'Glosario term created successfully')
    },
    {
      body: createGlosarioSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Glosario'],
        summary: 'Create glossary term',
        description:
          'Creates a term for the authenticated company. titulo must be unique within the company; there is no global glossary shared between tenants.',
      },
    },
  )

  .get(
    '/:id',
    async ({ params, companyId, glosarioService, jsonOk }) => {
      const glosario = await glosarioService.getById(params.id, companyId)
      return jsonOk(glosario)
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT, UserRole.CLIENT],
      detail: {
        tags: ['Glosario'],
        summary: 'Get glossary term detail',
        description:
          'Returns one term of the authenticated company. A term of another company is reported as not found.',
      },
    },
  )

  .patch(
    '/:id',
    async ({ params, body, companyId, glosarioService, jsonOk }) => {
      const glosario = await glosarioService.update(params.id, companyId, body)
      return jsonOk(glosario, 'Glosario term updated successfully')
    },
    {
      params: idParams,
      body: updateGlosarioSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Glosario'],
        summary: 'Update glossary term',
        description:
          'Updates titulo and/or descripcion. companyId cannot be changed and titulo stays unique within the company.',
      },
    },
  )

  .delete(
    '/:id',
    async ({ params, companyId, glosarioService, jsonOkNoData }) => {
      await glosarioService.softDelete(params.id, companyId)
      return jsonOkNoData('Glosario term deactivated successfully')
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Glosario'],
        summary: 'Deactivate glossary term',
        description:
          'Soft-deletes the term. Deactivated terms stop showing up in the normal listing and search.',
      },
    },
  )
