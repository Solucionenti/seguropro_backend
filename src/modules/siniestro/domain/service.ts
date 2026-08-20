import type { SiniestroStatus } from '@gen/enums'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { SiniestroWithDetails } from './entities'

export interface ListSiniestrosFilters {
  companyId: string
  clienteUserId?: string
  polizaId?: string
  siniestroStatus?: SiniestroStatus
  tipoSiniestro?: string
}

export interface CreateSiniestroServiceInput {
  companyId: string
  polizaId: string
  creadoPorUserId: string
  fechaEvento: Date
  tipoSiniestro?: string
  descripcion?: string
  ajustador?: string
  montoEstimado?: number
  siniestroStatus?: SiniestroStatus
}

export interface UpdateSiniestroServiceInput {
  tipoSiniestro?: string
  descripcion?: string
  ajustador?: string
  montoEstimado?: number
  montoPagado?: number
  siniestroStatus?: SiniestroStatus
}

export interface ISiniestroService {
  list(pageable: Pageable, filters: ListSiniestrosFilters): Promise<Page<SiniestroWithDetails>>
  create(input: CreateSiniestroServiceInput): Promise<SiniestroWithDetails>
  getById(id: string, companyId: string, clienteUserId?: string): Promise<SiniestroWithDetails>
  update(
    id: string,
    companyId: string,
    input: UpdateSiniestroServiceInput,
  ): Promise<SiniestroWithDetails>
  softDelete(id: string, companyId: string): Promise<void>
}
