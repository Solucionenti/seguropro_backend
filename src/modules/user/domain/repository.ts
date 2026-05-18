import type { Page, Pageable } from '@/shared/domain/pagination'
import type {
  CompanyInput,
  CreateUserInput,
  UpdateUserInput,
  User,
  UserWithCompany,
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
  create(input: CreateUserInput): Promise<User>
  createOwnerWithCompany(
    userInput: CreateUserInput,
    companyInput: CompanyInput,
  ): Promise<UserWithCompany>
  update(id: string, input: UpdateUserInput): Promise<User>
  softDelete(id: string): Promise<void>
}
