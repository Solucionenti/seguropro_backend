import type { Page, Pageable } from '@/shared/domain/pagination'
import type {
  CreateOrdenInput,
  CreateOwnerOrdenInput,
  OrdenWithDetails,
  PayOrdenInput,
  UpdateOrdenInput,
} from './entities'
import type { OrdenFilters } from './repository'

export type OwnerOrdenFilters = Pick<OrdenFilters, 'ordenStatus' | 'cicloInicio' | 'cicloFin'>

export interface IOrdenService {
  list(pageable: Pageable, filters?: OrdenFilters): Promise<Page<OrdenWithDetails>>
  create(input: CreateOrdenInput): Promise<OrdenWithDetails>
  getById(id: string): Promise<OrdenWithDetails>
  update(id: string, input: UpdateOrdenInput): Promise<OrdenWithDetails>
  deactivate(id: string): Promise<void>
  listMyOrdenes(
    companyId: string,
    pageable: Pageable,
    filters?: OwnerOrdenFilters,
  ): Promise<Page<OrdenWithDetails>>
  createMyOrden(companyId: string, input: CreateOwnerOrdenInput): Promise<OrdenWithDetails>
  getMyOrdenById(companyId: string, id: string): Promise<OrdenWithDetails>
  payMyOrden(companyId: string, id: string, input: PayOrdenInput): Promise<OrdenWithDetails>
  payMyFirstOrden(companyId: string, id: string, input: PayOrdenInput): Promise<OrdenWithDetails>
}
