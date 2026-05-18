import type { CompanyModel } from '@gen/models/Company'
import type { DetalleClienteModel } from '@gen/models/DetalleCliente'
import type { UserModel } from '@gen/models/User'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface User
  extends BaseEntity,
    Pick<
      UserModel,
      | 'companyId'
      | 'role'
      | 'firstName'
      | 'lastName'
      | 'email'
      | 'phone'
      | 'lastLoginAt'
      | 'active'
    > {}

export interface DetalleCliente
  extends BaseEntity,
    Pick<
      DetalleClienteModel,
      | 'userId'
      | 'fechaNacimiento'
      | 'rfc'
      | 'curp'
      | 'direccion'
      | 'ciudad'
      | 'estado'
      | 'codigoPostal'
      | 'notas'
    > {}

export interface UserWithDetalle extends User {
  detalleCliente: DetalleCliente | null
}

export type CreateDetalleClienteInput = Partial<
  Pick<
    DetalleClienteModel,
    | 'fechaNacimiento'
    | 'rfc'
    | 'curp'
    | 'direccion'
    | 'ciudad'
    | 'estado'
    | 'codigoPostal'
    | 'notas'
  >
>

export type UpdateDetalleClienteInput = CreateDetalleClienteInput

export type CreateUserInput = Pick<
  UserModel,
  'firstName' | 'lastName' | 'email' | 'phone' | 'passwordHash'
> & {
  companyId?: string | null
  role?: UserModel['role']
}

export type UpdateUserInput = Partial<
  Pick<UserModel, 'firstName' | 'lastName' | 'phone' | 'status' | 'lastLoginAt'>
>

export type UpdateProfileInput = Partial<Pick<UserModel, 'firstName' | 'lastName' | 'phone'>>

export type CompanyInput = Pick<
  CompanyModel,
  'nombreComercial' | 'emailContacto' | 'telefonoContacto'
> & {
  razonSocial?: string | null
}

export type CompanyInfo = Pick<
  CompanyModel,
  'id' | 'nombreComercial' | 'razonSocial' | 'emailContacto' | 'telefonoContacto'
>

export interface UserWithCompany extends User {
  company: CompanyInfo | null
}
