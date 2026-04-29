import type { IdentifyResult, LoginInput, LoginResult, RefreshResult } from './entities'

export interface IAuthService {
  login(input: LoginInput): Promise<LoginResult>
  identify(email: string): Promise<IdentifyResult>
  refresh(refreshToken: string): Promise<RefreshResult>
}
