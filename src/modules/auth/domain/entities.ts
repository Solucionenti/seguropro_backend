import type { AuthUser } from './auth-user-provider'

export interface LoginInput {
  email: string
  password: string
  companyId?: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: Pick<AuthUser, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'companyId'>
}

export interface IdentifyResult {
  companies: {
    companyId: string
    nombreComercial: string | null
  }[]
}
