import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { companyServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import { companyListQuery, updateMyCompanySchema } from './schemas'

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

  // registered before /:id so the static route wins
  .get(
    '/mi-empresa',
    async ({ companyId, companyService, jsonOk }) => {
      const company = await companyService.getMyCompany(companyId)
      return jsonOk(company)
    },
    {
      requireCompany: true,
      withRole: UserRole.OWNER,
      detail: {
        tags: ['Companies'],
        summary: 'Get my company (OWNER)',
        description:
          'Returns the company of the authenticated OWNER. The company is resolved from the JWT companyId, so an OWNER can never read another company.',
      },
    },
  )

  .put(
    '/mi-empresa',
    async ({ body, companyId, companyService, jsonOk }) => {
      const company = await companyService.updateMyCompany(companyId, body)
      return jsonOk(company, 'Company updated successfully')
    },
    {
      body: updateMyCompanySchema,
      requireCompany: true,
      withRole: UserRole.OWNER,
      detail: {
        tags: ['Companies'],
        summary: 'Update my company (OWNER)',
        description:
          'Replaces the editable data of the authenticated OWNER company. The target is resolved from the JWT companyId, never from the request, so an OWNER can only edit their own company. PUT semantics: emailContacto and telefonoContacto are required and every other field is set to null when omitted. id, status and the subscription cannot be changed here.',
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
