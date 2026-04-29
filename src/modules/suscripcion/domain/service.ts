import type {
  CreateOwnerSuscripcionInput,
  CreateSuscripcionInput,
  SuscripcionWithDetails,
  UpdateSuscripcionInput,
} from './entities'
import type { SuscripcionFilters } from './repository'

export interface ISuscripcionService {
  list(
    page: number,
    pageSize: number,
    filters: SuscripcionFilters,
  ): Promise<{ data: SuscripcionWithDetails[]; total: number }>
  create(input: CreateSuscripcionInput): Promise<SuscripcionWithDetails>
  getById(id: string): Promise<SuscripcionWithDetails>
  update(id: string, input: UpdateSuscripcionInput): Promise<SuscripcionWithDetails>
  deactivate(id: string): Promise<void>
  getMySubscription(companyId: string): Promise<SuscripcionWithDetails | null>
  createMySubscription(
    companyId: string,
    input: CreateOwnerSuscripcionInput,
  ): Promise<SuscripcionWithDetails>
  cancelMySubscription(companyId: string): Promise<void>
}
