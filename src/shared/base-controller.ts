import { Elysia } from 'elysia'
import { dbPlugin } from '@/config/database'
import { envPlugin } from '@/config/env'
import { errorHandler } from '@/shared/middleware/error-handler'
import { responsePlugin } from '@/shared/utils/response'

/**
 * Base controller plugin.
 *
 * Every module controller should `.use(baseController)` to get:
 *   - env: validated environment config
 *   - db: PrismaClient instance
 *   - error handler: standard ApiResponse error shape
 *   - response helpers: jsonOk, jsonOkNoData, jsonPaginated, jsonError
 *
 * Usage:
 *   export const myController = new Elysia({ name: '@app/modules/my-feature', prefix: '/my-feature' })
 *     .use(baseController)
 *     .get('/', ({ jsonOk }) => jsonOk({ hello: 'world' }))
 */
export const baseController = new Elysia({ name: '@app/shared/base-controller' })
  .use(envPlugin)
  .use(dbPlugin)
  .use(errorHandler)
  .use(responsePlugin)
  .as('global')
