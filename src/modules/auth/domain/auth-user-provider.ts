import type { UserModel } from '@gen/models/User'

export type AuthUser = Pick<
  UserModel,
  'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'companyId' | 'passwordHash' | 'status'
>

export type AuthUserWithCompany = AuthUser & { companyName: string | null }

export interface AuthUserProvider {
  findByEmailAndCompany(email: string, companyId: string): Promise<AuthUser | null>
  findMasterAdminByEmail(email: string): Promise<AuthUser | null>
  findMasterAdminOrOwnerByEmail(email: string): Promise<AuthUser | null>
  findCompaniesByEmail(
    email: string,
  ): Promise<{ companyId: string; nombreComercial: string | null }[]>
  findActiveByEmail(email: string): Promise<AuthUserWithCompany[]>
  findActiveById(userId: string): Promise<AuthUser | null>
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>
  updateLastLogin(userId: string, timestamp: Date): Promise<void>
}
