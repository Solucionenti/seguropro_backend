import type { Page, Pageable } from '@/shared/domain/pagination'
import type { Glosario } from './entities'

export interface ListGlosariosFilters {
  companyId: string
  titulo?: string
}

export interface CreateGlosarioServiceInput {
  companyId: string
  titulo: string
  descripcion: string
}

export interface UpdateGlosarioServiceInput {
  titulo?: string
  descripcion?: string
}

export interface IGlosarioService {
  list(pageable: Pageable, filters: ListGlosariosFilters): Promise<Page<Glosario>>
  create(input: CreateGlosarioServiceInput): Promise<Glosario>
  getById(id: string, companyId: string): Promise<Glosario>
  update(id: string, companyId: string, input: UpdateGlosarioServiceInput): Promise<Glosario>
  softDelete(id: string, companyId: string): Promise<void>
}
