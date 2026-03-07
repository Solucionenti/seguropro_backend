import { Elysia } from 'elysia'
import type { ApiMeta, ApiResponse, PaginationInfo } from './response-types'

function buildOk<T>(data: T, message?: string, meta?: ApiMeta): ApiResponse<T> {
  return {
    data,
    success: true,
    ...(message && { message }),
    ...(meta && { meta }),
  }
}

function buildOkNoData(message: string): ApiResponse<never> {
  return {
    success: true,
    message,
  }
}

function buildPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  message?: string,
): ApiResponse<T[]> {
  const totalPages = Math.ceil(total / pageSize)
  const pagination: PaginationInfo = {
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  }
  return {
    data,
    success: true,
    ...(message && { message }),
    meta: { pagination },
  }
}

function buildError(code: string, message: string): ApiResponse<never> {
  return {
    success: false,
    message: !message ? code : `${code}: ${message}`,
    data: undefined,
  }
}

export const responsePlugin = new Elysia({ name: '@app/shared/response' }).decorate({
  jsonOk<T>(data: T, message?: string, meta?: ApiMeta) {
    return buildOk(data, message, meta)
  },
  jsonOkNoData(message: string) {
    return buildOkNoData(message)
  },
  jsonPaginated<T>(data: T[], total: number, page: number, pageSize: number, message?: string) {
    return buildPaginated(data, total, page, pageSize, message)
  },
  jsonError(code: string, message: string) {
    return buildError(code, message)
  },
})
