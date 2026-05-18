import type { OrdenStatus } from '@gen/enums'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { CreateOrdenInput, Orden, OrdenWithDetails, UpdateOrdenInput } from './entities'

export interface OrdenFilters {
  companyId?: string
  ordenStatus?: OrdenStatus
  cicloInicio?: Date
  cicloFin?: Date
  active?: boolean
}

export interface OrdenRepository {
  findAll(pageable: Pageable, filters?: OrdenFilters): Promise<Page<OrdenWithDetails>>
  findById(id: string): Promise<OrdenWithDetails | null>
  findPagadaByPeriod(
    suscripcionId: string,
    cicloInicio: Date,
    cicloFin: Date,
  ): Promise<Orden | null>
  create(input: CreateOrdenInput): Promise<OrdenWithDetails>
  update(id: string, input: UpdateOrdenInput): Promise<OrdenWithDetails>
  deactivate(id: string): Promise<void>
}
