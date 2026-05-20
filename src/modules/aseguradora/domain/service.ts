import type { Page, Pageable } from '@/shared/domain/pagination'
import type { Aseguradora } from './entities'

export interface ListAseguradorasFilters {
  companyId: string
  nombre?: string
}

export interface CreateAseguradoraServiceInput {
  companyId: string
  nombre: string
  descripcion?: string | null
}

export interface UpdateAseguradoraServiceInput {
  nombre?: string
  descripcion?: string | null
}

export interface IAseguradoraService {
  list(pageable: Pageable, filters: ListAseguradorasFilters): Promise<Page<Aseguradora>>
  create(input: CreateAseguradoraServiceInput): Promise<Aseguradora>
  getById(id: string, companyId: string): Promise<Aseguradora>
  update(id: string, companyId: string, input: UpdateAseguradoraServiceInput): Promise<Aseguradora>
  softDelete(id: string, companyId: string): Promise<void>
}
