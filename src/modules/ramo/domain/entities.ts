import type { RamoModel } from '@gen/models/Ramo'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface Ramo
  extends BaseEntity,
    Pick<RamoModel, 'companyId' | 'nombre' | 'descripcion' | 'active'> {}

export type CreateRamoInput = Pick<RamoModel, 'companyId' | 'nombre'> & {
  descripcion?: string | null
}

export type UpdateRamoInput = Partial<Pick<RamoModel, 'nombre' | 'descripcion'>>
