import { Elysia } from 'elysia'
import { AppError } from '@/shared/domain/app-error'
import type { ApiResponse } from '@/shared/utils/response-types'

// `as: 'global'` es obligatorio: los hooks de un plugin son locales por defecto,
// así que sin esto el handler no corre y Elysia responde el error crudo en texto
// plano con status 500.
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

    // Al ser global, este hook también recibe los errores propios de Elysia:
    // hay que respetar su status en vez de convertirlos todos en 500.
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
