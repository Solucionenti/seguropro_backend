import type { Page, Pageable } from '@/shared/domain/pagination'
import type { Company } from './entities'
import type { CompanyFilters } from './repository'

export interface ICompanyService {
  list(pageable: Pageable, filters: CompanyFilters): Promise<Page<Company>>
  getById(id: string): Promise<Company>
}
