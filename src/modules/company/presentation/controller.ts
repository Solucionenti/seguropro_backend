import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { companyServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import { companyListQuery } from './schemas'

const COMPANY_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'nombreComercial',
  'razonSocial',
  'emailContacto',
] as const

export const companyController = new Elysia({
  name: '@app/modules/company',
  prefix: '/companies',
})
  .use(authRouter)
  .use(companyServicePlugin)

  .get(
    '/',
    async ({ query, pageable, companyService, jsonOk }) => {
      const page = await companyService.list(pageable, {
        nombre: query.nombre,
        rfc: query.rfc,
        tipoPersona: query.tipoPersona,
      })
      return jsonOk(page)
    },
    {
      query: companyListQuery,
      paginated: { sortFields: COMPANY_SORT_FIELDS },
      withRole: UserRole.MASTER_ADMIN,
      detail: {
        tags: ['Companies'],
        summary: 'List companies',
        description:
          'Returns a paginated list of companies (tenants). Supports filtering by nombre (matches nombreComercial or razonSocial), rfc and tipoPersona.',
      },
    },
  )

  .get(
    '/:id',
    async ({ params, companyService, jsonOk }) => {
      const company = await companyService.getById(params.id)
      return jsonOk(company)
    },
    {
      params: idParams,
      withRole: UserRole.MASTER_ADMIN,
      detail: {
        tags: ['Companies'],
        summary: 'Get company detail',
        description: 'Returns full details of a company (tenant).',
      },
    },
  )
