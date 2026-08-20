import type { Page, Pageable } from '@/shared/domain/pagination'
import type { CreateTareaKanbanInput, TareaKanban, UpdateTareaKanbanInput } from './entities'

export interface TareaKanbanFilters {
  companyId: string
  columnaKanbanId?: string
  polizaId?: string
  titulo?: string
}

export interface TareaKanbanRepository {
  findAll(pageable: Pageable, filters: TareaKanbanFilters): Promise<Page<TareaKanban>>
  findById(id: string, companyId: string): Promise<TareaKanban | null>
  create(input: CreateTareaKanbanInput): Promise<TareaKanban>
  update(id: string, input: UpdateTareaKanbanInput): Promise<TareaKanban>
  hardDelete(id: string): Promise<void>
}
