import type { PolizaStatus } from '@gen/enums'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { PolizaWithDetails } from './entities'

export interface ListPolizasFilters {
  companyId: string
  clienteUserId?: string
  aseguradoraId?: string
  ramoId?: string
  polizaStatus?: PolizaStatus
  numeroPoliza?: string
}

export interface CreatePolizaServiceInput {
  companyId: string
  aseguradoraId: string
  ramoId: string
  clienteUserId: string
  numeroPoliza: string
  fechaInicio: Date
  fechaVencimiento: Date
  primaNeta: number
  primaTotal: number
  polizaStatus?: PolizaStatus
}

export interface UpdatePolizaServiceInput {
  primaNeta?: number
  primaTotal?: number
  fechaVencimiento?: Date
  polizaStatus?: PolizaStatus
}

export interface UpdatePolizaKanbanServiceInput {
  kanbanId: string | null
}

export interface IPolizaService {
  list(pageable: Pageable, filters: ListPolizasFilters): Promise<Page<PolizaWithDetails>>
  create(input: CreatePolizaServiceInput): Promise<PolizaWithDetails>
  getById(id: string, companyId: string, clienteUserId?: string): Promise<PolizaWithDetails>
  update(id: string, companyId: string, input: UpdatePolizaServiceInput): Promise<PolizaWithDetails>
  updateKanban(
    id: string,
    companyId: string,
    input: UpdatePolizaKanbanServiceInput,
  ): Promise<PolizaWithDetails>
  softDelete(id: string, companyId: string): Promise<void>
}
