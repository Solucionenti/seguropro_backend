import type { Page, Pageable } from '@/shared/domain/pagination'
import type { ColumnaKanban } from './entities'

export interface ListColumnasKanbanFilters {
  companyId: string
  nombre?: string
}

export interface CreateColumnaKanbanServiceInput {
  companyId: string
  nombre: string
  prioridad: number
}

export interface UpdateColumnaKanbanServiceInput {
  nombre?: string
  prioridad?: number
}

export interface IColumnaKanbanService {
  list(pageable: Pageable, filters: ListColumnasKanbanFilters): Promise<Page<ColumnaKanban>>
  create(input: CreateColumnaKanbanServiceInput): Promise<ColumnaKanban>
  getById(id: string, companyId: string): Promise<ColumnaKanban>
  update(
    id: string,
    companyId: string,
    input: UpdateColumnaKanbanServiceInput,
  ): Promise<ColumnaKanban>
  hardDelete(id: string, companyId: string): Promise<void>
}
