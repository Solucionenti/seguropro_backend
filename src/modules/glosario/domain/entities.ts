import type { GlosarioModel } from '@gen/models/Glosario'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface Glosario
  extends BaseEntity,
    Pick<GlosarioModel, 'companyId' | 'titulo' | 'descripcion' | 'active'> {}

export type CreateGlosarioInput = Pick<GlosarioModel, 'companyId' | 'titulo' | 'descripcion'>

export type UpdateGlosarioInput = Partial<Pick<GlosarioModel, 'titulo' | 'descripcion'>>
