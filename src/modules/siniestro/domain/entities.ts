import type { PolizaModel } from '@gen/models/Poliza'
import type { SiniestroModel } from '@gen/models/Siniestro'
import type { UserModel } from '@gen/models/User'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface Siniestro
  extends BaseEntity,
    Pick<
      SiniestroModel,
      | 'companyId'
      | 'polizaId'
      | 'clienteUserId'
      | 'creadoPorUserId'
      | 'tipoSiniestro'
      | 'fechaEvento'
      | 'descripcion'
      | 'ajustador'
      | 'montoEstimado'
      | 'montoPagado'
      | 'siniestroStatus'
      | 'active'
    > {}

export type PolizaBasicInfo = Pick<
  PolizaModel,
  'id' | 'companyId' | 'clienteUserId' | 'numeroPoliza' | 'fechaInicio' | 'fechaVencimiento'
>

export type UserBasicInfo = Pick<UserModel, 'id' | 'companyId' | 'firstName' | 'lastName' | 'email'>

export interface SiniestroWithDetails extends Siniestro {
  poliza: Pick<PolizaModel, 'id' | 'companyId' | 'numeroPoliza'>
  cliente: UserBasicInfo
  creadoPor: UserBasicInfo
}

export type CreateSiniestroInput = Pick<
  SiniestroModel,
  'companyId' | 'polizaId' | 'clienteUserId' | 'creadoPorUserId' | 'fechaEvento'
> & {
  tipoSiniestro?: string | null
  descripcion?: string | null
  ajustador?: string | null
  montoEstimado?: number | null
  siniestroStatus?: SiniestroModel['siniestroStatus']
}

export type UpdateSiniestroInput = Partial<
  Pick<
    SiniestroModel,
    | 'tipoSiniestro'
    | 'descripcion'
    | 'ajustador'
    | 'montoEstimado'
    | 'montoPagado'
    | 'siniestroStatus'
  >
>
