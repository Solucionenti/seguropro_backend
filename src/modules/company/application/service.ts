import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { Company } from '../domain/entities'
import type { CompanyFilters, CompanyRepository } from '../domain/repository'
import type { ICompanyService, UpdateMyCompanyServiceInput } from '../domain/service'

export class CompanyService implements ICompanyService {
  constructor(private readonly repo: CompanyRepository) {}

  async list(pageable: Pageable, filters: CompanyFilters): Promise<Page<Company>> {
    return this.repo.findAll(pageable, filters)
  }

  async getById(id: string): Promise<Company> {
    const company = await this.repo.findById(id)
    if (!company) {
      throw new NotFoundError('Company', id)
    }
    return company
  }

  // companyId always comes from the jwt, so a caller can only ever reach their own company
  async getMyCompany(companyId: string): Promise<Company> {
    return this.getById(companyId)
  }

  async updateMyCompany(companyId: string, input: UpdateMyCompanyServiceInput): Promise<Company> {
    // an inactive company is not readable, so it is not editable either
    await this.getById(companyId)

    return this.repo.update(companyId, {
      emailContacto: input.emailContacto,
      telefonoContacto: input.telefonoContacto,
      razonSocial: input.razonSocial ?? null,
      nombreComercial: input.nombreComercial ?? null,
      rfc: input.rfc ?? null,
      tipoPersona: input.tipoPersona ?? null,
      pais: input.pais ?? null,
      estado: input.estado ?? null,
    })
  }
}
