import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import zodToJsonSchema from 'zod-to-json-schema'
import { v1 } from '@/api/v1'
import { errorHandler } from '@/shared/middleware/error-handler'

export const app = new Elysia({ name: '@app/root' })
  .use(
    openapi({
      documentation: {
        info: {
          title: 'Segur API',
          version: '1.0.0',
          description: 'Segur backend API',
        },
      },
      mapJsonSchema: {
        zod: zodToJsonSchema,
      },
    }),
  )
  .use(cors())
  .use(errorHandler)
  .use(v1)
