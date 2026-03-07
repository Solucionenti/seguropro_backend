import { z } from 'zod'
import { envConfig } from '@/config/env'

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(envConfig.PAGINATION_MAX_PAGE_SIZE)
    .default(envConfig.PAGINATION_DEFAULT_PAGE_SIZE),
})

export const idParams = z.object({
  id: z.string().uuid('Invalid ID format'),
})
