import type { CompanyModel } from '@gen/models/Company'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface Company
  extends BaseEntity,
    Pick<
      CompanyModel,
      | 'razonSocial'
      | 'nombreComercial'
      | 'rfc'
      | 'tipoPersona'
      | 'emailContacto'
      | 'telefonoContacto'
      | 'pais'
      | 'estado'
    > {}

// full replacement: the optional fields are nulled when omitted
export type UpdateCompanyInput = Pick<
  CompanyModel,
  | 'emailContacto'
  | 'telefonoContacto'
  | 'razonSocial'
  | 'nombreComercial'
  | 'rfc'
  | 'tipoPersona'
  | 'pais'
  | 'estado'
>
