import { Elysia } from 'elysia'
import { authServicePlugin, userServicePlugin } from '@/config/services'
import { createOwnerSchema } from '@/modules/user/presentation/schemas'
import { publicRouter } from '@/shared/routers/public-router'
import { identifySchema, loginSchema, refreshSchema } from './schemas'

export const authController = new Elysia({
  name: '@app/modules/auth',
  prefix: '/auth',
})
  .use(publicRouter)
  .use(userServicePlugin)
  .use(authServicePlugin)
  .post(
    '/login',
    async ({ body, authService, jsonOk }) => {
      const result = await authService.login(body)
      return jsonOk(result, 'Login successful')
    },
    {
      body: loginSchema,
      detail: {
        tags: ['Auth'],
        summary: 'Login',
        description:
          'Authenticate a user with email and password. Requires companyId for tenant-scoped users. Omit companyId for MASTER_ADMIN login.',
      },
    },
  )
  .post(
    '/identify',
    async ({ body, authService, jsonOk }) => {
      const result = await authService.identify(body.email)
      return jsonOk(result)
    },
    {
      body: identifySchema,
      detail: {
        tags: ['Auth'],
        summary: 'Identify user companies',
        description:
          'Given an email, returns the list of companies where this email is registered. Use this before login when a user may belong to multiple companies.',
      },
    },
  )
  .post(
    '/refresh',
    async ({ body, authService, jsonOk }) => {
      const result = await authService.refresh(body.refreshToken)
      return jsonOk(result, 'Tokens refreshed')
    },
    {
      body: refreshSchema,
      detail: {
        tags: ['Auth'],
        summary: 'Refresh tokens',
        description: 'Exchange a valid refresh token for a new access/refresh token pair.',
      },
    },
  )
  .post(
    '/register-owner',
    async ({ body, userService, jsonOk }) => {
      const result = await userService.createOwner(body)
      return jsonOk(result, 'Owner and company created successfully')
    },
    {
      body: createOwnerSchema,
      detail: {
        tags: ['Register Owner'],
        summary: 'Create OWNER with Company',
        description:
          'Creates a new OWNER user and their associated Company in a single transaction. Email must be globally unique among owners. One OWNER per Company.',
      },
    },
  )
