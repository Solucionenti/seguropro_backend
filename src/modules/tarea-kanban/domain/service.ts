import type { Page, Pageable } from '@/shared/domain/pagination'
import type { TareaKanban } from './entities'

export interface ListTareasKanbanFilters {
  companyId: string
  columnaKanbanId?: string
  polizaId?: string
  titulo?: string
}

export interface CreateTareaKanbanServiceInput {
  companyId: string
  columnaKanbanId?: string | null
  polizaId?: string | null
  titulo: string
  descripcion?: string | null
}

export interface UpdateTareaKanbanServiceInput {
  columnaKanbanId?: string | null
  polizaId?: string | null
  titulo?: string
  descripcion?: string | null
}

export interface ITareaKanbanService {
  list(pageable: Pageable, filters: ListTareasKanbanFilters): Promise<Page<TareaKanban>>
  create(input: CreateTareaKanbanServiceInput): Promise<TareaKanban>
  getById(id: string, companyId: string): Promise<TareaKanban>
  update(id: string, companyId: string, input: UpdateTareaKanbanServiceInput): Promise<TareaKanban>
  hardDelete(id: string, companyId: string): Promise<void>
}
