import type { Page, Pageable } from '@/shared/domain/pagination'
import type { ColumnaKanban, CreateColumnaKanbanInput, UpdateColumnaKanbanInput } from './entities'

export interface ColumnaKanbanFilters {
  companyId: string
  nombre?: string
}

export interface ColumnaKanbanRepository {
  findAll(pageable: Pageable, filters: ColumnaKanbanFilters): Promise<Page<ColumnaKanban>>
  findById(id: string, companyId: string): Promise<ColumnaKanban | null>
  findByPrioridadAndCompany(prioridad: number, companyId: string): Promise<ColumnaKanban | null>
  create(input: CreateColumnaKanbanInput): Promise<ColumnaKanban>
  update(id: string, input: UpdateColumnaKanbanInput): Promise<ColumnaKanban>
  updateWithPriorityReorder(
    id: string,
    companyId: string,
    currentPriority: number,
    newPriority: number,
    input: UpdateColumnaKanbanInput,
  ): Promise<ColumnaKanban>
  hardDelete(id: string): Promise<void>
  hardDeleteWithPriorityReorder(id: string, companyId: string, priority: number): Promise<void>
}
