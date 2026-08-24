import type { Page, Pageable } from '@/shared/domain/pagination'
import type { CreateGlosarioInput, Glosario, UpdateGlosarioInput } from './entities'

export interface GlosarioFilters {
  companyId: string
  titulo?: string
}

export interface GlosarioRepository {
  findAll(pageable: Pageable, filters: GlosarioFilters): Promise<Page<Glosario>>
  findById(id: string, companyId: string): Promise<Glosario | null>
  findByTituloAndCompany(titulo: string, companyId: string): Promise<Glosario | null>
  create(input: CreateGlosarioInput): Promise<Glosario>
  update(id: string, input: UpdateGlosarioInput): Promise<Glosario>
  softDelete(id: string): Promise<void>
}
