import { z } from 'zod'
import { envConfig } from '@/config/env'
import { Pageable, type Sort } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'

export const pageableSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(envConfig.PAGINATION_MAX_PAGE_SIZE)
    .default(envConfig.PAGINATION_DEFAULT_PAGE_SIZE),
  sortField: z.string().min(1).max(64).optional(),
  sortBy: z.enum(['asc', 'desc']).default('desc'),
})

export type PageableQuery = z.infer<typeof pageableSchema>

export const paginationQuery = pageableSchema

export const idParams = z.object({
  id: z.string().uuid('Invalid ID format'),
})

export function toPageable(query: unknown, allowedSortFields?: readonly string[]): Pageable {
  const result = pageableSchema.safeParse(query)
  if (!result.success) {
    throw new ValidationError('Invalid pagination parameters')
  }
  const parsed = result.data
  const sort: Sort[] = []
  if (parsed.sortField) {
    if (allowedSortFields && !allowedSortFields.includes(parsed.sortField)) {
      throw new ValidationError(`sortField must be one of: ${allowedSortFields.join(', ')}`)
    }
    sort.push({ field: parsed.sortField, direction: parsed.sortBy })
  }
  return new Pageable(parsed.page, parsed.pageSize, sort)
}

export function listQuery<T extends z.ZodRawShape>(filters: T) {
  return pageableSchema.extend(filters)
}
