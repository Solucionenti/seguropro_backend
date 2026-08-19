import type { TipoPersona } from '@gen/enums'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { Company } from './entities'

export interface CompanyFilters {
  nombre?: string
  rfc?: string
  tipoPersona?: TipoPersona
}

export interface CompanyRepository {
  findAll(pageable: Pageable, filters: CompanyFilters): Promise<Page<Company>>
  findById(id: string): Promise<Company | null>
}
