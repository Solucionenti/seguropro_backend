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
