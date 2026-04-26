import type { PlanModel } from '@gen/models/Plan'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface Plan
  extends BaseEntity,
    Pick<
      PlanModel,
      | 'nombre'
      | 'descripcion'
      | 'precio'
      | 'periodicidad'
      | 'limiteUsuarios'
      | 'limiteAlmacenamientoGB'
      | 'features'
      | 'active'
    > {}

export type CreatePlanInput = Pick<
  PlanModel,
  'nombre' | 'precio' | 'periodicidad' | 'limiteUsuarios'
> & {
  descripcion?: string | null
  limiteAlmacenamientoGB?: number | null
  features?: string[]
}

export type UpdatePlanInput = Partial<
  Pick<
    PlanModel,
    | 'nombre'
    | 'descripcion'
    | 'precio'
    | 'periodicidad'
    | 'limiteUsuarios'
    | 'limiteAlmacenamientoGB'
  >
> & {
  features?: string[]
}
