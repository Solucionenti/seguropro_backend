import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { userServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams, pageableSchema } from '@/shared/utils/pagination'
import {
  createAdminSchema,
  createOwnerSchema,
  updateAdminSchema,
  updateOwnerSchema,
  updateProfileSchema,
} from './schemas'

const USER_SORT_FIELDS = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'] as const

export const userController = new Elysia({ name: '@app/modules/user', prefix: '/users' })
  .use(authRouter)
  .use(userServicePlugin)

  // ── Admin CRUD (MASTER_ADMIN only) ───────────────────

  .group('/admins', (app) =>
    app
      .get(
        '/',
        async ({ pageable, userService, jsonOk }) => {
          const page = await userService.listAdmins(pageable)
          return jsonOk(page)
        },
        {
          query: pageableSchema,
          paginated: { sortFields: USER_SORT_FIELDS },
          withRole: UserRole.MASTER_ADMIN,
          detail: {
            tags: ['Admin Users'],
            summary: 'List MASTER_ADMIN users',
            description: 'Returns a paginated list of all MASTER_ADMIN users.',
          },
        },
      )
      .post(
        '/',
        async ({ body, userService, jsonOk }) => {
          const user = await userService.createAdmin(body)
          return jsonOk(user, 'Admin created successfully')
        },
        {
          body: createAdminSchema,
          withRole: UserRole.MASTER_ADMIN,
          detail: {
            tags: ['Admin Users'],
            summary: 'Create MASTER_ADMIN user',
            description:
              'Creates a new user with MASTER_ADMIN role. Email must be unique among admins.',
          },
        },
      )
      .get(
        '/:id',
        async ({ params, userService, jsonOk }) => {
          const user = await userService.getAdmin(params.id)
          return jsonOk(user)
        },
        {
          params: idParams,
          withRole: UserRole.MASTER_ADMIN,
          detail: {
            tags: ['Admin Users'],
            summary: 'Get MASTER_ADMIN detail',
            description: 'Returns full details of a MASTER_ADMIN user.',
          },
        },
      )
      .patch(
        '/:id',
        async ({ params, body, userService, jsonOk }) => {
          const user = await userService.updateAdmin(params.id, body)
          return jsonOk(user, 'Admin updated successfully')
        },
        {
          params: idParams,
          body: updateAdminSchema,
          withRole: UserRole.MASTER_ADMIN,
          detail: {
            tags: ['Admin Users'],
            summary: 'Update MASTER_ADMIN user',
            description:
              'Updates allowed fields of a MASTER_ADMIN user. Cannot change role or companyId.',
          },
        },
      )
      .delete(
        '/:id',
        async ({ params, userService, jsonOkNoData }) => {
          await userService.deleteAdmin(params.id)
          return jsonOkNoData('Admin deactivated successfully')
        },
        {
          params: idParams,
          withRole: UserRole.MASTER_ADMIN,
          detail: {
            tags: ['Admin Users'],
            summary: 'Deactivate MASTER_ADMIN user',
            description: 'Soft-deletes a MASTER_ADMIN user. Cannot delete the last active admin.',
          },
        },
      ),
  )

  // ── Owner CRUD (MASTER_ADMIN only) ───────────────────

  .group('/owners', (app) =>
    app
      .get(
        '/',
        async ({ pageable, userService, jsonOk }) => {
          const page = await userService.listOwners(pageable)
          return jsonOk(page)
        },
        {
          query: pageableSchema,
          paginated: { sortFields: USER_SORT_FIELDS },
          withRole: UserRole.MASTER_ADMIN,
          detail: {
            tags: ['Owner Users'],
            summary: 'List OWNER users',
            description:
              'Returns a paginated list of all OWNER users with their associated company info.',
          },
        },
      )
      .post(
        '/',
        async ({ body, userService, jsonOk }) => {
          const result = await userService.createOwner(body)
          return jsonOk(result, 'Owner and company created successfully')
        },
        {
          body: createOwnerSchema,
          withRole: UserRole.MASTER_ADMIN,
          detail: {
            tags: ['Owner Users'],
            summary: 'Create OWNER with Company',
            description:
              'Creates a new OWNER user and their associated Company in a single transaction. Email must be globally unique among owners. One OWNER per Company.',
          },
        },
      )
      .get(
        '/:id',
        async ({ params, userService, jsonOk }) => {
          const result = await userService.getOwner(params.id)
          return jsonOk(result)
        },
        {
          params: idParams,
          withRole: UserRole.MASTER_ADMIN,
          detail: {
            tags: ['Owner Users'],
            summary: 'Get OWNER detail',
            description:
              'Returns full details of an OWNER user with associated company information.',
          },
        },
      )
      .patch(
        '/:id',
        async ({ params, body, userService, jsonOk }) => {
          const user = await userService.updateOwner(params.id, body)
          return jsonOk(user, 'Owner updated successfully')
        },
        {
          params: idParams,
          body: updateOwnerSchema,
          withRole: UserRole.MASTER_ADMIN,
          detail: {
            tags: ['Owner Users'],
            summary: 'Update OWNER user',
            description:
              'Updates allowed fields of an OWNER user. Cannot change role or companyId.',
          },
        },
      )
      .delete(
        '/:id',
        async ({ params, userService, jsonOkNoData }) => {
          await userService.deleteOwner(params.id)
          return jsonOkNoData('Owner deactivated successfully')
        },
        {
          params: idParams,
          withRole: UserRole.MASTER_ADMIN,
          detail: {
            tags: ['Owner Users'],
            summary: 'Deactivate OWNER user',
            description: 'Soft-deletes an OWNER user.',
          },
        },
      ),
  )

  // ── Profile (self-service, any authenticated user) ───

  .get(
    '/me',
    async ({ userId, userService, jsonOk }) => {
      const user = await userService.getProfile(userId)
      return jsonOk(user)
    },
    {
      detail: {
        tags: ['Profile'],
        summary: 'Get my profile',
        description: "Returns the authenticated user's profile information.",
      },
    },
  )
  .patch(
    '/me',
    async ({ userId, body, userService, jsonOk }) => {
      const user = await userService.updateProfile(userId, body)
      return jsonOk(user, 'Profile updated successfully')
    },
    {
      body: updateProfileSchema,
      detail: {
        tags: ['Profile'],
        summary: 'Update my profile',
        description:
          "Updates the authenticated user's profile. Only firstName, lastName, and phone can be changed.",
      },
    },
  )
