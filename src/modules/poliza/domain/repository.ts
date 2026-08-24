import type { PolizaStatus } from '@gen/enums'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type {
  CreatePolizaInput,
  CreateRenovacionInput,
  PolizaWithDetails,
  UpdatePolizaInput,
} from './entities'

export interface PolizaFilters {
  companyId: string
  clienteUserId?: string
  aseguradoraId?: string
  ramoId?: string
  polizaStatus?: PolizaStatus
  numeroPoliza?: string
}

export interface PolizaRepository {
  findAll(pageable: Pageable, filters: PolizaFilters): Promise<Page<PolizaWithDetails>>
  findById(id: string, companyId: string, clienteUserId?: string): Promise<PolizaWithDetails | null>
  findByNumeroAndCompany(numeroPoliza: string, companyId: string): Promise<PolizaWithDetails | null>
  create(input: CreatePolizaInput): Promise<PolizaWithDetails>
  createRenovacion(input: CreateRenovacionInput): Promise<PolizaWithDetails>
  findRenovacionActiva(polizaAnteriorId: string): Promise<PolizaWithDetails | null>
  update(id: string, input: UpdatePolizaInput): Promise<PolizaWithDetails>
  softDelete(id: string): Promise<void>
}
