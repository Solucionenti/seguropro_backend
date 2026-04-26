import type { OrdenModel } from '@gen/models/Orden'
import type { BaseEntity } from '@/shared/domain/base-entity'

export type CompanyBasicInfo = {
  id: string
  nombreComercial: string | null
  razonSocial: string | null
}

export type SuscripcionBasicInfo = {
  id: string
  companyId: string
  company: CompanyBasicInfo
}

export interface Orden
  extends BaseEntity,
    Pick<
      OrdenModel,
      | 'suscripcionId'
      | 'cicloInicio'
      | 'cicloFin'
      | 'monto'
      | 'moneda'
      | 'ordenStatus'
      | 'active'
      | 'proveedor'
      | 'proveedorOrdenId'
      | 'proveedorPagoId'
      | 'pagadaEn'
      | 'motivoFallo'
    > {}

export interface OrdenWithDetails extends Orden {
  suscripcion: SuscripcionBasicInfo
}

export type CreateOrdenInput = Pick<
  OrdenModel,
  'suscripcionId' | 'cicloInicio' | 'cicloFin' | 'monto' | 'moneda' | 'ordenStatus'
> & {
  proveedor?: string | null
  proveedorOrdenId?: string | null
  proveedorPagoId?: string | null
}

export type UpdateOrdenInput = Partial<
  Pick<
    OrdenModel,
    | 'ordenStatus'
    | 'proveedor'
    | 'proveedorOrdenId'
    | 'proveedorPagoId'
    | 'pagadaEn'
    | 'motivoFallo'
  >
>
