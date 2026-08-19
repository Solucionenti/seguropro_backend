import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { Company } from '../domain/entities'
import type { CompanyFilters, CompanyRepository } from '../domain/repository'
import type { ICompanyService } from '../domain/service'

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
}
