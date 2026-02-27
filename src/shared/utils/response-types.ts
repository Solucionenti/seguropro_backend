export interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface ApiMeta {
  pagination?: PaginationInfo
}

export interface ApiResponse<T = unknown> {
  data?: T
  success: boolean
  message?: string
  meta?: ApiMeta
}
