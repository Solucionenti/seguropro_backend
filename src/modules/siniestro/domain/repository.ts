import type { SiniestroStatus } from '@gen/enums'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { CreateSiniestroInput, SiniestroWithDetails, UpdateSiniestroInput } from './entities'

export interface SiniestroFilters {
  companyId: string
  clienteUserId?: string
  polizaId?: string
  siniestroStatus?: SiniestroStatus
  tipoSiniestro?: string
}

export interface SiniestroRepository {
  findAll(pageable: Pageable, filters: SiniestroFilters): Promise<Page<SiniestroWithDetails>>
  findById(
    id: string,
    companyId: string,
    clienteUserId?: string,
  ): Promise<SiniestroWithDetails | null>
  create(input: CreateSiniestroInput): Promise<SiniestroWithDetails>
  update(id: string, input: UpdateSiniestroInput): Promise<SiniestroWithDetails>
  softDelete(id: string): Promise<void>
}
