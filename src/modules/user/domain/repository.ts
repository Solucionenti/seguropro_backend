import type { UserRole } from '@gen/enums'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type {
  CompanyInput,
  CreateDetalleClienteInput,
  CreateUserInput,
  UpdateDetalleClienteInput,
  UpdateUserInput,
  User,
  UserWithCompany,
  UserWithDetalle,
} from './entities'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByCompanyId(companyId: string, pageable: Pageable): Promise<Page<User>>
  findByEmailAndCompany(email: string, companyId: string): Promise<User | null>
  findMasterAdminByEmail(email: string): Promise<User | null>
  findMasterAdminOrOwnerByEmail(email: string): Promise<User | null>
  findCompaniesByEmail(
    email: string,
  ): Promise<{ companyId: string; nombreComercial: string | null }[]>
  findAllMasterAdmins(pageable: Pageable): Promise<Page<User>>
  findAllOwners(pageable: Pageable): Promise<Page<UserWithCompany>>
  findOwnerByEmail(email: string): Promise<User | null>
  findOwnerWithCompany(id: string): Promise<UserWithCompany | null>
  findCompleteOwner(id: string): Promise<UserWithCompany | null>
  countActiveMasterAdmins(): Promise<number>
  countActiveOwnersByCompany(companyId: string): Promise<number>
  isCompanyActive(companyId: string): Promise<boolean>
  countActiveCompanyUsers(companyId: string): Promise<number>
  findCompanyUsers(companyId: string, pageable: Pageable, roles: UserRole[]): Promise<Page<User>>
  findCompanyUserById(companyId: string, id: string): Promise<UserWithDetalle | null>
  create(input: CreateUserInput): Promise<User>
  createOwnerWithCompany(
    userInput: CreateUserInput,
    companyInput: CompanyInput,
  ): Promise<UserWithCompany>
  createCompanyUser(
    input: CreateUserInput,
    detalle?: CreateDetalleClienteInput,
  ): Promise<UserWithDetalle>
  update(id: string, input: UpdateUserInput): Promise<User>
  updateCompanyUserWithDetalle(
    id: string,
    input: UpdateUserInput,
    detalle?: UpdateDetalleClienteInput,
  ): Promise<UserWithDetalle>
  softDelete(id: string): Promise<void>
  deactivateUser(id: string): Promise<void>
}
