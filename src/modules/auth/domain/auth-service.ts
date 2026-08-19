import type {
  IdentifyResult,
  LoginInput,
  LoginResult,
  RefreshResult,
  ResetPasswordInput,
} from './entities'

export interface IAuthService {
  login(input: LoginInput): Promise<LoginResult>
  identify(email: string): Promise<IdentifyResult>
  refresh(refreshToken: string): Promise<RefreshResult>
  forgotPassword(email: string): Promise<void>
  resetPassword(input: ResetPasswordInput): Promise<void>
}
