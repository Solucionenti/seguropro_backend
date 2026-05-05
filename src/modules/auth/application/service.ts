import { ResourceStatus } from '@gen/enums'
import type { JwtService } from '@/shared/domain/jwt-service'
import type { PasswordHasher } from '@/shared/domain/password-hasher'
import { UnauthorizedError } from '@/shared/domain/unauthorized-error'
import type { IAuthService } from '../domain/auth-service'
import type { AuthUserProvider } from '../domain/auth-user-provider'
import type { IdentifyResult, LoginInput, LoginResult, RefreshResult } from '../domain/entities'

export class AuthService implements IAuthService {
  constructor(
    private readonly authUserProvider: AuthUserProvider,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const user = input.companyId
      ? await this.authUserProvider.findByEmailAndCompany(input.email, input.companyId)
      : await this.authUserProvider.findMasterAdminOrOwnerByEmail(input.email)

    if (!user) {
      throw new UnauthorizedError('Invalid credentials')
    }

    if (user.status !== ResourceStatus.ACTIVE) {
      throw new UnauthorizedError('Account is not active')
    }

    const isValid = await this.passwordHasher.verify(input.password, user.passwordHash)

    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials')
    }

    const tokens = await this.jwtService.signTokenPair({
      sub: user.id,
      role: user.role,
      companyId: user.companyId,
    })

    await this.authUserProvider.updateLastLogin(user.id, new Date())

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
      },
    }
  }

  async identify(email: string): Promise<IdentifyResult> {
    const companies = await this.authUserProvider.findCompaniesByEmail(email)
    return { companies }
  }

  async refresh(refreshToken: string): Promise<RefreshResult> {
    const payload = await this.jwtService.verifyRefreshToken(refreshToken)
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired refresh token')
    }
    return this.jwtService.signTokenPair({
      sub: payload.sub,
      role: payload.role,
      companyId: payload.companyId,
    })
  }
}
