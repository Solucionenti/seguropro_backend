import { Elysia } from 'elysia'
import { AppError } from '@/shared/domain/app-error'
import type { ApiResponse } from '@/shared/utils/response-types'

export const errorHandler = new Elysia({ name: '@app/shared/error-handler' }).onError(
  ({ error, set }): ApiResponse<never> => {
    if (error instanceof AppError) {
      set.status = error.statusCode
      return {
        success: false,
        message: error.message,
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
