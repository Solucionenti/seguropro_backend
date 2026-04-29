import type {
  CreateOrdenInput,
  CreateOwnerOrdenInput,
  OrdenWithDetails,
  PayOrdenInput,
  UpdateOrdenInput,
} from './entities'
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
  listMyOrdenes(
    companyId: string,
    page: number,
    pageSize: number,
    filters: Pick<OrdenFilters, 'ordenStatus' | 'cicloInicio' | 'cicloFin'>,
  ): Promise<{ data: OrdenWithDetails[]; total: number }>
  createMyOrden(companyId: string, input: CreateOwnerOrdenInput): Promise<OrdenWithDetails>
  getMyOrdenById(companyId: string, id: string): Promise<OrdenWithDetails>
  payMyOrden(companyId: string, id: string, input: PayOrdenInput): Promise<OrdenWithDetails>
}
