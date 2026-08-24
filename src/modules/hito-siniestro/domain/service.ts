import type { HitoStatus } from '@gen/enums'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { HitoAlerta, Severidad } from './alertas'
import type { HitoSiniestroWithDetails } from './entities'

/// clienteUserId set means the caller is a CLIENT and the siniestro must be theirs
export interface HitoScope {
  siniestroId: string
  companyId: string
  clienteUserId?: string
}

export interface ListHitosFilters {
  hitoStatus?: HitoStatus
  asignadoAUserId?: string
}

export interface CreateHitoServiceInput {
  tarea: string
  fechaLimite: Date
  descripcion?: string
  alerta?: boolean
  hitoStatus?: HitoStatus
  asignadoAUserId?: string
}

export interface UpdateHitoServiceInput {
  tarea?: string
  descripcion?: string
  fechaLimite?: Date
  alerta?: boolean
  hitoStatus?: HitoStatus
  asignadoAUserId?: string | null
}

export interface ListAlertasFilters {
  companyId: string
  diasHorizonte: number
  severidad?: Severidad
  asignadoAUserId?: string
  siniestroId?: string
}

export interface IHitoService {
  list(
    scope: HitoScope,
    pageable: Pageable,
    filters: ListHitosFilters,
  ): Promise<Page<HitoSiniestroWithDetails>>
  create(scope: HitoScope, input: CreateHitoServiceInput): Promise<HitoSiniestroWithDetails>
  getById(id: string, scope: HitoScope): Promise<HitoSiniestroWithDetails>
  update(
    id: string,
    scope: HitoScope,
    input: UpdateHitoServiceInput,
  ): Promise<HitoSiniestroWithDetails>
  softDelete(id: string, scope: HitoScope): Promise<void>
  listAlertas(pageable: Pageable, filters: ListAlertasFilters): Promise<Page<HitoAlerta>>
}
