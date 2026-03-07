import type { UserModel } from '@gen/models/User'

export type AuthUser = Pick<
  UserModel,
  'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'companyId' | 'passwordHash' | 'status'
>

export interface AuthUserProvider {
  findByEmailAndCompany(email: string, companyId: string): Promise<AuthUser | null>
  findMasterAdminByEmail(email: string): Promise<AuthUser | null>
  findCompaniesByEmail(
    email: string,
  ): Promise<{ companyId: string; nombreComercial: string | null }[]>
  updateLastLogin(userId: string, timestamp: Date): Promise<void>
}
