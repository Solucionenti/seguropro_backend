import type { ColumnaKanbanModel } from '@gen/models/ColumnaKanban'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface ColumnaKanban
  extends BaseEntity,
    Pick<ColumnaKanbanModel, 'companyId' | 'nombre' | 'prioridad'> {}

export type CreateColumnaKanbanInput = Pick<
  ColumnaKanbanModel,
  'companyId' | 'nombre' | 'prioridad'
>

export type UpdateColumnaKanbanInput = Partial<Pick<ColumnaKanbanModel, 'nombre' | 'prioridad'>>
