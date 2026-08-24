import type { HitoSiniestroModel } from '@gen/models/HitoSiniestro'
import type { SiniestroModel } from '@gen/models/Siniestro'
import type { UserModel } from '@gen/models/User'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface HitoSiniestro
  extends BaseEntity,
    Pick<
      HitoSiniestroModel,
      | 'siniestroId'
      | 'tarea'
      | 'descripcion'
      | 'fechaLimite'
      | 'alerta'
      | 'hitoStatus'
      | 'asignadoAUserId'
      | 'active'
    > {}

export type AsignadoBasicInfo = Pick<
  UserModel,
  'id' | 'companyId' | 'firstName' | 'lastName' | 'email' | 'role'
>

export interface HitoSiniestroWithDetails extends HitoSiniestro {
  asignadoA: AsignadoBasicInfo | null
}

export type SiniestroBasicInfo = Pick<SiniestroModel, 'id' | 'companyId' | 'clienteUserId'>

export type CreateHitoSiniestroInput = Pick<
  HitoSiniestroModel,
  'siniestroId' | 'tarea' | 'fechaLimite'
> & {
  descripcion?: string | null
  alerta?: boolean
  hitoStatus?: HitoSiniestroModel['hitoStatus']
  asignadoAUserId?: string | null
}

export type UpdateHitoSiniestroInput = Partial<
  Pick<
    HitoSiniestroModel,
    'tarea' | 'descripcion' | 'fechaLimite' | 'alerta' | 'hitoStatus' | 'asignadoAUserId'
  >
>
