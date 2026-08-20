import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { companyUserServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams, pageableSchema } from '@/shared/utils/pagination'
import {
  createAgentSchema,
  createClientSchema,
  updateCompanyUserSchema,
} from './company-user-schemas'

const USER_SORT_FIELDS = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'] as const

export const companyUserController = new Elysia({
  name: '@app/modules/company-user',
  prefix: '/users',
})
  .use(authRouter)
  .use(companyUserServicePlugin)
  .group('/mis-usuarios', (app) =>
    app
      .get(
        '/',
        async ({ companyId, userRole, pageable, companyUserService, jsonOk }) => {
          const page = await companyUserService.listCompanyUsers(
            companyId,
            userRole as UserRole,
            pageable,
          )
          return jsonOk(page)
        },
        {
          query: pageableSchema,
          paginated: { sortFields: USER_SORT_FIELDS },
          requireCompany: true,
          withRole: [UserRole.OWNER, UserRole.AGENT],
          detail: {
            tags: ['Company Users'],
            summary: 'List company users',
            description:
              'OWNER sees AGENT and CLIENT. AGENT sees CLIENT only. Returns active users only.',
          },
        },
      )
      .get(
        '/clientes',
        async ({ companyId, pageable, companyUserService, jsonOk }) => {
          const page = await companyUserService.listCompanyClients(companyId, pageable)
          return jsonOk(page)
        },
        {
          query: pageableSchema,
          paginated: { sortFields: USER_SORT_FIELDS },
          requireCompany: true,
          withRole: [UserRole.OWNER],
          detail: {
            tags: ['Company Users'],
            summary: 'List company clients',
            description: 'Returns only CLIENT users.',
          },
        },
      )
      .get(
        '/agentes',
        async ({ companyId, pageable, companyUserService, jsonOk }) => {
          const page = await companyUserService.listCompanyAgents(companyId, pageable)
          return jsonOk(page)
        },
        {
          query: pageableSchema,
          paginated: { sortFields: USER_SORT_FIELDS },
          requireCompany: true,
          withRole: [UserRole.OWNER],
          detail: {
            tags: ['Company Users'],
            summary: 'List company agents',
            description: 'Returns only AGENT users.',
          },
        },
      )
      .post(
        '/agentes',
        async ({ companyId, body, companyUserService, jsonOk }) => {
          const user = await companyUserService.createAgent(companyId, body)
          return jsonOk(user, 'Agent created successfully')
        },
        {
          body: createAgentSchema,
          requireCompany: true,
          withRole: UserRole.OWNER,
          detail: {
            tags: ['Company Users'],
            summary: 'Create AGENT user',
            description:
              'Creates an AGENT user. Validates active subscription status and user limit from plan.',
          },
        },
      )
      .post(
        '/clientes',
        async ({ companyId, body, companyUserService, jsonOk }) => {
          const user = await companyUserService.createClient(companyId, body)
          return jsonOk(user, 'Client created successfully')
        },
        {
          body: createClientSchema,
          requireCompany: true,
          withRole: [UserRole.OWNER, UserRole.AGENT],
          detail: {
            tags: ['Company Users'],
            summary: 'Create CLIENT user with DetalleCliente',
            description:
              'Creates a CLIENT user and optional DetalleCliente in a single transaction.',
          },
        },
      )
      .get(
        '/:id',
        async ({ companyId, params, userRole, companyUserService, jsonOk }) => {
          const user = await companyUserService.getCompanyUser(
            companyId,
            params.id,
            userRole as UserRole,
          )
          return jsonOk(user)
        },
        {
          params: idParams,
          requireCompany: true,
          withRole: [UserRole.OWNER, UserRole.AGENT],
          detail: {
            tags: ['Company Users'],
            summary: 'Get company user detail',
            description:
              'Returns user detail including DetalleCliente for CLIENT users. AGENT cannot view AGENT users.',
          },
        },
      )
      .patch(
        '/:id',
        async ({ companyId, params, userRole, body, companyUserService, jsonOk }) => {
          const user = await companyUserService.updateCompanyUser(
            companyId,
            params.id,
            userRole as UserRole,
            body,
          )
          return jsonOk(user, 'User updated successfully')
        },
        {
          params: idParams,
          body: updateCompanyUserSchema,
          requireCompany: true,
          withRole: [UserRole.OWNER, UserRole.AGENT],
          detail: {
            tags: ['Company Users'],
            summary: 'Update company user',
            description:
              'Updates user fields. For CLIENT users, optionally updates DetalleCliente. Role and companyId cannot be changed.',
          },
        },
      )
      .delete(
        '/:id',
        async ({ companyId, params, userRole, companyUserService, jsonOkNoData }) => {
          await companyUserService.deactivateCompanyUser(companyId, params.id, userRole as UserRole)
          return jsonOkNoData('User deactivated successfully')
        },
        {
          params: idParams,
          requireCompany: true,
          withRole: [UserRole.OWNER, UserRole.AGENT],
          detail: {
            tags: ['Company Users'],
            summary: 'Deactivate company user',
            description: 'Sets active=false on the user. AGENT cannot deactivate AGENT users.',
          },
        },
      ),
  )
