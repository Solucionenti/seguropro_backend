import type { CreateOrdenInput, OrdenWithDetails, UpdateOrdenInput } from './entities'
import type { OrdenFilters } from './repository'

export interface IOrdenService {
  list(
    page: number,
    pageSize: number,
    filters: OrdenFilters,
  ): Promise<{ data: OrdenWithDetails[]; total: number }>
  create(input: CreateOrdenInput): Promise<OrdenWithDetails>
  getById(id: string): Promise<OrdenWithDetails>
  update(id: string, input: UpdateOrdenInput): Promise<OrdenWithDetails>
  deactivate(id: string): Promise<void>
}
