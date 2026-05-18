import { Elysia } from 'elysia'
import { Page } from '@/shared/domain/pagination'
import type { ApiMeta, ApiResponse, PaginationInfo } from './response-types'

type JsonOk = {
  <T>(data: T, message?: string, meta?: ApiMeta): ApiResponse<T>
  <T>(page: Page<T>, message?: string): ApiResponse<readonly T[]>
}

const jsonOk: JsonOk = ((arg: unknown, message?: string, meta?: ApiMeta): ApiResponse<unknown> => {
  if (arg instanceof Page) {
    const pagination: PaginationInfo = {
      total: arg.total,
      page: arg.page,
      pageSize: arg.pageSize,
      totalPages: arg.totalPages,
      hasNext: arg.hasNext,
      hasPrevious: arg.hasPrevious,
    }
    return {
      data: arg.content,
      success: true,
      ...(message && { message }),
      meta: { pagination },
    }
  }
  return {
    data: arg,
    success: true,
    ...(message && { message }),
    ...(meta && { meta }),
  }
}) as JsonOk

const jsonOkNoData = (message: string): ApiResponse<never> => ({
  success: true,
  message,
})

const jsonError = (code: string, message?: string): ApiResponse<never> => ({
  success: false,
  message: message ? `${code}: ${message}` : code,
  data: undefined,
})

export const responsePlugin = new Elysia({ name: '@app/shared/response' }).decorate({
  jsonOk,
  jsonOkNoData,
  jsonError,
})
