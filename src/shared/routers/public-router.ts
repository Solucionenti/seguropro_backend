import { Elysia } from 'elysia'
import { dbPlugin } from '@/config/database'
import { errorHandler } from '@/shared/middleware/error-handler'
import { toPageable } from '@/shared/utils/pagination'
import { responsePlugin } from '@/shared/utils/response'

export const publicRouter = new Elysia({ name: '@app/shared/public-router' })
  .use(dbPlugin)
  .use(errorHandler)
  .use(responsePlugin)
  .macro({
    paginated: (config?: true | { sortFields?: readonly string[] }) => ({
      resolve(ctx) {
        const allowed = typeof config === 'object' ? config.sortFields : undefined
        return { pageable: toPageable(ctx.query, allowed) }
      },
    }),
  })
  .as('scoped')
