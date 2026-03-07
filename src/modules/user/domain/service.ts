import type { UserModel } from '@gen/models/User'
import type {
  CompanyInput,
  UpdateProfileInput,
  UpdateUserInput,
  User,
  UserWithCompany,
} from './entities'

export type CreateAdminInput = Pick<UserModel, 'firstName' | 'lastName' | 'email' | 'phone'> & {
  password: string
}

export type CreateOwnerInput = CreateAdminInput & {
  company: CompanyInput
}

export interface IUserService {
  listAdmins(page: number, pageSize: number): Promise<{ data: User[]; total: number }>
  createAdmin(input: CreateAdminInput): Promise<User>
  getAdmin(id: string): Promise<User>
  updateAdmin(id: string, input: UpdateUserInput): Promise<User>
  deleteAdmin(id: string): Promise<void>

  listOwners(page: number, pageSize: number): Promise<{ data: UserWithCompany[]; total: number }>
  createOwner(input: CreateOwnerInput): Promise<UserWithCompany>
  getOwner(id: string): Promise<UserWithCompany>
  updateOwner(id: string, input: UpdateUserInput): Promise<User>
  deleteOwner(id: string): Promise<void>

  getProfile(userId: string): Promise<User>
  updateProfile(userId: string, input: UpdateProfileInput): Promise<User>
}
