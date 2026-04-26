import type {
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
}
