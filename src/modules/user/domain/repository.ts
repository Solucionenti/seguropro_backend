import type {
  CompanyInput,
  CreateUserInput,
  UpdateUserInput,
  User,
  UserWithCompany,
} from './entities'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByCompanyId(
    companyId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: User[]; total: number }>
  findByEmailAndCompany(email: string, companyId: string): Promise<User | null>
  findMasterAdminByEmail(email: string): Promise<User | null>
  findCompaniesByEmail(
    email: string,
  ): Promise<{ companyId: string; nombreComercial: string | null }[]>
  findAllMasterAdmins(page: number, pageSize: number): Promise<{ data: User[]; total: number }>
  findAllOwners(page: number, pageSize: number): Promise<{ data: UserWithCompany[]; total: number }>
  findOwnerByEmail(email: string): Promise<User | null>
  findOwnerWithCompany(id: string): Promise<UserWithCompany | null>
  countActiveMasterAdmins(): Promise<number>
  create(input: CreateUserInput): Promise<User>
  createOwnerWithCompany(
    userInput: CreateUserInput,
    companyInput: CompanyInput,
  ): Promise<UserWithCompany>
  update(id: string, input: UpdateUserInput): Promise<User>
  softDelete(id: string): Promise<void>
}
