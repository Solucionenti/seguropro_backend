import type { OrdenStatus } from '@gen/enums'
import type { CreateOrdenInput, Orden, OrdenWithDetails, UpdateOrdenInput } from './entities'

export interface OrdenFilters {
  companyId?: string
  ordenStatus?: OrdenStatus
  cicloInicio?: Date
  cicloFin?: Date
}

export interface OrdenRepository {
  findAll(
    page: number,
    pageSize: number,
    filters: OrdenFilters,
  ): Promise<{ data: OrdenWithDetails[]; total: number }>
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
