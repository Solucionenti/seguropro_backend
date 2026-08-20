import type { TareaKanbanModel } from '@gen/models/TareaKanban'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface TareaKanban
  extends BaseEntity,
    Pick<
      TareaKanbanModel,
      'companyId' | 'columnaKanbanId' | 'polizaId' | 'titulo' | 'descripcion'
    > {}

export type CreateTareaKanbanInput = Pick<
  TareaKanbanModel,
  'companyId' | 'columnaKanbanId' | 'polizaId' | 'titulo' | 'descripcion'
>

export type UpdateTareaKanbanInput = Partial<
  Pick<TareaKanbanModel, 'columnaKanbanId' | 'polizaId' | 'titulo' | 'descripcion'>
>
