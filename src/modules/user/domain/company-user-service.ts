import type { UserRole } from '@gen/enums'
import type { UserModel } from '@gen/models/User'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type {
  CreateDetalleClienteInput,
  UpdateDetalleClienteInput,
  User,
  UserWithDetalle,
} from './entities'

export type CreateAgentInput = Pick<UserModel, 'firstName' | 'lastName' | 'email' | 'phone'> & {
  password: string
}

export type CreateClientInput = CreateAgentInput & {
  detalle?: CreateDetalleClienteInput
}

export type UpdateCompanyUserInput = Partial<
  Pick<UserModel, 'firstName' | 'lastName' | 'phone' | 'status'>
> & {
  detalle?: UpdateDetalleClienteInput
}

export interface ICompanyUserService {
  listCompanyUsers(
    companyId: string,
    requestorRole: UserRole,
    pageable: Pageable,
  ): Promise<Page<User>>
  listCompanyAgents(companyId: string, pageable: Pageable): Promise<Page<User>>
  listCompanyClients(companyId: string, pageable: Pageable): Promise<Page<User>>
  createAgent(companyId: string, input: CreateAgentInput): Promise<UserWithDetalle>
  createClient(companyId: string, input: CreateClientInput): Promise<UserWithDetalle>
  getCompanyUser(companyId: string, id: string, requestorRole: UserRole): Promise<UserWithDetalle>
  updateCompanyUser(
    companyId: string,
    id: string,
    requestorRole: UserRole,
    input: UpdateCompanyUserInput,
  ): Promise<UserWithDetalle>
  deactivateCompanyUser(companyId: string, id: string, requestorRole: UserRole): Promise<void>
}
