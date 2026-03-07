import type { IdentifyResult, LoginInput, LoginResult } from './entities'

export interface IAuthService {
  login(input: LoginInput): Promise<LoginResult>
  identify(email: string): Promise<IdentifyResult>
}
