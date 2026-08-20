import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import zodToJsonSchema from 'zod-to-json-schema'
import { v1 } from '@/api/v1'
import { envConfig } from '@/config/env'
import { errorHandler } from '@/shared/middleware/error-handler'

// rejected at the transport layer, before an oversized upload is buffered in memory.
// the per-file business cap lives in ArchivoPolizaService and is necessarily lower
const MAX_REQUEST_BODY_BYTES = Math.ceil(envConfig.STORAGE_MAX_FILE_SIZE_MB * 1.5) * 1024 * 1024

export const app = new Elysia({
  name: '@app/root',
  serve: { maxRequestBodySize: MAX_REQUEST_BODY_BYTES },
})
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
