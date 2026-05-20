import type { AseguradoraModel } from '@gen/models/Aseguradora'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface Aseguradora
  extends BaseEntity,
    Pick<AseguradoraModel, 'companyId' | 'nombre' | 'descripcion' | 'active'> {}

export type CreateAseguradoraInput = Pick<AseguradoraModel, 'companyId' | 'nombre'> & {
  descripcion?: string | null
}

export type UpdateAseguradoraInput = Partial<Pick<AseguradoraModel, 'nombre' | 'descripcion'>>
