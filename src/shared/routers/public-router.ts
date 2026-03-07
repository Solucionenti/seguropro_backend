import { Elysia } from 'elysia'
import { dbPlugin } from '@/config/database'
import { errorHandler } from '@/shared/middleware/error-handler'
import { paginationQuery } from '@/shared/utils/pagination'
import { responsePlugin } from '@/shared/utils/response'

export const publicRouter = new Elysia({ name: '@app/shared/public-router' })
  .use(dbPlugin)
  .use(errorHandler)
  .use(responsePlugin)
  .macro('paginated', {
    query: paginationQuery,
    resolve({ query }) {
      return { page: query.page, pageSize: query.pageSize }
    },
  })
  .as('scoped')
