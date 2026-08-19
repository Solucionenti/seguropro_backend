import type { TipoPersona } from '@gen/enums'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { Company } from './entities'
import type { CompanyFilters } from './repository'

export interface UpdateMyCompanyServiceInput {
  emailContacto: string
  telefonoContacto: string
  razonSocial?: string | null
  nombreComercial?: string | null
  rfc?: string | null
  tipoPersona?: TipoPersona | null
  pais?: string | null
  estado?: string | null
}

export interface ICompanyService {
  list(pageable: Pageable, filters: CompanyFilters): Promise<Page<Company>>
  getById(id: string): Promise<Company>
  getMyCompany(companyId: string): Promise<Company>
  updateMyCompany(companyId: string, input: UpdateMyCompanyServiceInput): Promise<Company>
}
