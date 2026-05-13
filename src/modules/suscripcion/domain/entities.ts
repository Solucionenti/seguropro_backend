import type { SuscripcionStatus } from '@gen/enums'
import type { OrdenModel } from '@gen/models'
import type { CompanyModel } from '@gen/models/Company'
import type { PlanModel } from '@gen/models/Plan'
import type { SuscripcionModel } from '@gen/models/Suscripcion'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface Suscripcion
  extends BaseEntity,
    Pick<
      SuscripcionModel,
      | 'companyId'
      | 'planId'
      | 'suscripcionStatus'
      | 'active'
      | 'fechaInicio'
      | 'fechaFin'
      | 'fechaProximoPago'
      | 'renovacionAutomatica'
    > {}

export type CompanyBasicInfo = Pick<CompanyModel, 'id' | 'nombreComercial' | 'razonSocial'>

export type PlanBasicInfo = Pick<PlanModel, 'id' | 'nombre' | 'precio' | 'periodicidad'>

export type OrdenBasicInfo = Pick<OrdenModel, 'id'>

export interface SuscripcionWithDetails extends Suscripcion {
  company: CompanyBasicInfo
  plan: PlanBasicInfo
  ordenes?: OrdenBasicInfo[]
}

export type CreateSuscripcionInput = Pick<
  SuscripcionModel,
  'companyId' | 'planId' | 'suscripcionStatus' | 'fechaInicio' | 'fechaProximoPago'
> & {
  active?: boolean
  fechaFin?: Date | null
  renovacionAutomatica?: boolean
}

export type CreateOwnerSuscripcionInput = {
  planId: string
  suscripcionStatus?: SuscripcionStatus
  renovacionAutomatica?: boolean
}

export type UpdateSuscripcionInput = Partial<
  Pick<
    SuscripcionModel,
    | 'suscripcionStatus'
    | 'fechaInicio'
    | 'fechaFin'
    | 'fechaProximoPago'
    | 'renovacionAutomatica'
    | 'active'
  >
>
