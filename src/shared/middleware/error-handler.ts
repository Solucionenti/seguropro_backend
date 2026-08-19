import { Elysia } from 'elysia'
import { AppError } from '@/shared/domain/app-error'
import type { ApiResponse } from '@/shared/utils/response-types'

// as: 'global' is required, plugin hooks are local by default and without it every
// AppError leaks as plain text with status 500
export const errorHandler = new Elysia({ name: '@app/shared/error-handler' }).onError(
  { as: 'global' },
  ({ code, error, set }): ApiResponse<never> => {
    if (error instanceof AppError) {
      set.status = error.statusCode
      return {
        success: false,
        message: error.message,
      }
    }

    // being global this also catches elysia's own errors, keep their status
    const builtIn: Partial<Record<typeof code, number>> = {
      NOT_FOUND: 404,
      VALIDATION: 422,
      PARSE: 400,
      INVALID_COOKIE_SIGNATURE: 401,
    }

    const status = builtIn[code]

    if (status) {
      set.status = status
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      }
    }

    console.error('Unhandled error:', error)
    set.status = 500
    return {
      success: false,
      message: 'An unexpected error occurred',
    }
  },
)
