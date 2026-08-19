import { Elysia } from 'elysia'
import { authServicePlugin, userServicePlugin } from '@/config/services'
import { createOwnerSchema } from '@/modules/user/presentation/schemas'
import { publicRouter } from '@/shared/routers/public-router'
import {
  forgotPasswordSchema,
  identifySchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
} from './schemas'

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
    '/forgot-password',
    async ({ body, authService, jsonOkNoData }) => {
      await authService.forgotPassword(body.email)
      // same response whether or not the account exists, avoids user enumeration
      return jsonOkNoData('If the email exists, a reset link has been sent')
    },
    {
      body: forgotPasswordSchema,
      detail: {
        tags: ['Auth'],
        summary: 'Request password reset',
        description:
          'Sends a password reset link to the email. If the email is registered in several companies, one email is sent per account. Always returns the same response regardless of whether the email exists.',
      },
    },
  )
  .post(
    '/reset-password',
    async ({ body, authService, jsonOkNoData }) => {
      await authService.resetPassword(body)
      return jsonOkNoData('Password updated successfully')
    },
    {
      body: resetPasswordSchema,
      detail: {
        tags: ['Auth'],
        summary: 'Reset password',
        description:
          'Sets a new password using the token from the reset email. The token is single-use: it stops validating once the password changes.',
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
