import type { SuscripcionStatus } from '@gen/enums'
import type {
  CreateSuscripcionInput,
  Suscripcion,
  SuscripcionWithDetails,
  UpdateSuscripcionInput,
} from './entities'

export interface SuscripcionFilters {
  companyId?: string
  suscripcionStatus?: SuscripcionStatus
  active?: boolean
}

export interface SuscripcionRepository {
  findAll(
    page: number,
    pageSize: number,
    filters: SuscripcionFilters,
  ): Promise<{ data: SuscripcionWithDetails[]; total: number }>
  findById(id: string): Promise<SuscripcionWithDetails | null>
  findActiveByCompany(companyId: string): Promise<Suscripcion | null>
  findActiveByCompanyWithDetails(companyId: string): Promise<SuscripcionWithDetails | null>
  create(input: CreateSuscripcionInput): Promise<SuscripcionWithDetails>
  createSuscipcionWithOrden(input: CreateSuscripcionInput): Promise<SuscripcionWithDetails>
  update(id: string, input: UpdateSuscripcionInput): Promise<SuscripcionWithDetails>
  deactivateByCompany(companyId: string, excludeId?: string): Promise<void>
  deactivate(id: string): Promise<void>
}
