import type { HitoStatus } from '@gen/enums'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type {
  CreateHitoSiniestroInput,
  HitoSiniestroWithDetails,
  UpdateHitoSiniestroInput,
} from './entities'

export interface HitoFilters {
  siniestroId: string
  hitoStatus?: HitoStatus
  asignadoAUserId?: string
}

export interface HitoRepository {
  findAllBySiniestro(
    pageable: Pageable,
    filters: HitoFilters,
  ): Promise<Page<HitoSiniestroWithDetails>>
  findByIdForSiniestro(id: string, siniestroId: string): Promise<HitoSiniestroWithDetails | null>
  create(input: CreateHitoSiniestroInput): Promise<HitoSiniestroWithDetails>
  update(id: string, input: UpdateHitoSiniestroInput): Promise<HitoSiniestroWithDetails>
  softDelete(id: string): Promise<void>
}
