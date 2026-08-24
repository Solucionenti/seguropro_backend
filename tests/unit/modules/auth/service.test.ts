import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus, UserRole } from '@gen/enums'
import { AuthService } from '@/modules/auth/application/service'
import type {
  AuthUser,
  AuthUserProvider,
  AuthUserWithCompany,
} from '@/modules/auth/domain/auth-user-provider'
import type { EmailSender } from '@/shared/domain/email-sender'
import type { JwtService, JwtTokenPair } from '@/shared/domain/jwt-service'
import type { PasswordHasher } from '@/shared/domain/password-hasher'
import { UnauthorizedError } from '@/shared/domain/unauthorized-error'
import type { Mocked } from '../../../utils/mocked'

// ── Factories ────────────────────────────────────────────

function createMockUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'agent@test.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.AGENT,
    companyId: 'company-1',
    passwordHash: 'hashed-password',
    status: ResourceStatus.ACTIVE,
    ...overrides,
  }
}

function createTokenPair(): JwtTokenPair {
  return { accessToken: 'access-token', refreshToken: 'refresh-token' }
}

// ── Mocks ────────────────────────────────────────────────

function createMocks() {
  const authUserProvider: Mocked<AuthUserProvider> = {
    findByEmailAndCompany: mock(() => Promise.resolve(null)),
    findMasterAdminByEmail: mock(() => Promise.resolve(null)),
    findCompaniesByEmail: mock(() => Promise.resolve([])),
    updateLastLogin: mock(() => Promise.resolve()),
    findMasterAdminOrOwnerByEmail: mock(() => Promise.resolve(null)),
    findActiveByEmail: mock(() => Promise.resolve([] as AuthUserWithCompany[])),
    findActiveById: mock(() => Promise.resolve(null)),
    updatePasswordHash: mock(() => Promise.resolve()),
  }

  const passwordHasher: Mocked<PasswordHasher> = {
    hash: mock(() => Promise.resolve('hashed')),
    verify: mock(() => Promise.resolve(true)),
  }

  const jwtService: Mocked<JwtService> = {
    signAccessToken: mock(() => Promise.resolve('access-token')),
    signRefreshToken: mock(() => Promise.resolve('refresh-token')),
    signTokenPair: mock(() => Promise.resolve(createTokenPair())),
    verifyAccessToken: mock(() => Promise.resolve(null)),
    verifyRefreshToken: mock(() => Promise.resolve(null)),
    signPasswordResetToken: mock(() => Promise.resolve('reset-token')),
    verifyPasswordResetToken: mock(() => Promise.resolve(null)),
    passwordFingerprint: mock((hash: string) => Promise.resolve(`fp:${hash}`)),
  }

  const emailSender: Mocked<EmailSender> = {
    sendPasswordReset: mock(() => Promise.resolve()),
    sendPolizaPorVencer: mock(() => Promise.resolve()),
    sendHitoAlerta: mock(() => Promise.resolve()),
  }

  return { authUserProvider, passwordHasher, jwtService, emailSender }
}

// ── Tests ────────────────────────────────────────────────

describe('AuthService', () => {
  let authService: AuthService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    authService = new AuthService(
      mocks.authUserProvider,
      mocks.passwordHasher,
      mocks.jwtService,
      mocks.emailSender,
      { appUrl: 'https://app.test', expiresIn: '15m' },
    )
  })

  describe('login', () => {
    it('should login a tenant user with companyId', async () => {
      const user = createMockUser()
      mocks.authUserProvider.findByEmailAndCompany.mockResolvedValue(user)

      const result = await authService.login({
        email: 'agent@test.com',
        password: 'password123',
        companyId: 'company-1',
      })

      expect(result.accessToken).toBe('access-token')
      expect(result.refreshToken).toBe('refresh-token')
      expect(result.user.id).toBe('user-1')
      expect(result.user.email).toBe('agent@test.com')
      expect(result.user.role).toBe(UserRole.AGENT)
      expect(result.user.companyId).toBe('company-1')
      expect(mocks.authUserProvider.findByEmailAndCompany).toHaveBeenCalledWith(
        'agent@test.com',
        'company-1',
      )
      expect(mocks.authUserProvider.updateLastLogin).toHaveBeenCalledTimes(1)
    })

    it('should login a MASTER_ADMIN without companyId', async () => {
      const masterAdmin = createMockUser({
        id: 'admin-1',
        role: UserRole.MASTER_ADMIN,
        companyId: null,
      })
      mocks.authUserProvider.findMasterAdminOrOwnerByEmail.mockResolvedValue(masterAdmin)

      const result = await authService.login({
        email: 'admin@test.com',
        password: 'password123',
      })

      expect(result.user.role).toBe(UserRole.MASTER_ADMIN)
      expect(result.user.companyId).toBeNull()
      expect(mocks.authUserProvider.findMasterAdminOrOwnerByEmail).toHaveBeenCalledWith(
        'admin@test.com',
      )
      expect(mocks.authUserProvider.findByEmailAndCompany).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedError when user not found', async () => {
      expect(
        authService.login({
          email: 'unknown@test.com',
          password: 'password123',
          companyId: 'company-1',
        }),
      ).rejects.toThrow(UnauthorizedError)
    })

    it('should throw UnauthorizedError when password is invalid', async () => {
      const user = createMockUser()
      mocks.authUserProvider.findByEmailAndCompany.mockResolvedValue(user)
      mocks.passwordHasher.verify.mockResolvedValue(false)

      expect(
        authService.login({
          email: 'agent@test.com',
          password: 'wrong-password',
          companyId: 'company-1',
        }),
      ).rejects.toThrow(UnauthorizedError)
    })

    it('should throw UnauthorizedError when user status is SUSPENDED', async () => {
      const user = createMockUser({ status: ResourceStatus.INACTIVE })
      mocks.authUserProvider.findByEmailAndCompany.mockResolvedValue(user)

      expect(
        authService.login({
          email: 'agent@test.com',
          password: 'password123',
          companyId: 'company-1',
        }),
      ).rejects.toThrow(UnauthorizedError)
    })

    it('should throw UnauthorizedError when user is soft-deleted', async () => {
      const user = createMockUser({ status: ResourceStatus.DELETED })
      mocks.authUserProvider.findByEmailAndCompany.mockResolvedValue(user)

      expect(
        authService.login({
          email: 'agent@test.com',
          password: 'password123',
          companyId: 'company-1',
        }),
      ).rejects.toThrow(UnauthorizedError)
    })

    it('should sign JWT with correct payload', async () => {
      const user = createMockUser({ id: 'u-42', role: UserRole.OWNER, companyId: 'c-99' })
      mocks.authUserProvider.findByEmailAndCompany.mockResolvedValue(user)

      await authService.login({
        email: 'agent@test.com',
        password: 'password123',
        companyId: 'c-99',
      })

      expect(mocks.jwtService.signTokenPair).toHaveBeenCalledWith({
        sub: 'u-42',
        role: UserRole.OWNER,
        companyId: 'c-99',
      })
    })

    it('should not update lastLoginAt when login fails', async () => {
      await authService
        .login({
          email: 'unknown@test.com',
          password: 'password123',
          companyId: 'company-1',
        })
        .catch(() => {})

      expect(mocks.authUserProvider.updateLastLogin).not.toHaveBeenCalled()
    })
  })

  describe('identify', () => {
    it('should return companies for a known email', async () => {
      const companies = [
        { companyId: 'c-1', nombreComercial: 'Seguros MX' },
        { companyId: 'c-2', nombreComercial: 'Seguros AR' },
      ]
      mocks.authUserProvider.findCompaniesByEmail.mockResolvedValue(companies)

      const result = await authService.identify('agent@test.com')

      expect(result.companies).toHaveLength(2)
      expect(result.companies[0]?.companyId).toBe('c-1')
      expect(result.companies[1]?.nombreComercial).toBe('Seguros AR')
      expect(mocks.authUserProvider.findCompaniesByEmail).toHaveBeenCalledWith('agent@test.com')
    })

    it('should return empty array for unknown email', async () => {
      const result = await authService.identify('unknown@test.com')

      expect(result.companies).toHaveLength(0)
    })
  })

  describe('forgotPassword', () => {
    it('should send one email per account sharing the email', async () => {
      mocks.authUserProvider.findActiveByEmail.mockResolvedValue([
        { ...createMockUser({ id: 'u-1' }), companyName: 'Seguros MX' },
        { ...createMockUser({ id: 'u-2', companyId: 'c-2' }), companyName: 'Seguros AR' },
      ])

      await authService.forgotPassword('agent@test.com')

      expect(mocks.emailSender.sendPasswordReset).toHaveBeenCalledTimes(2)
      expect(mocks.jwtService.signPasswordResetToken).toHaveBeenCalledWith('u-1', 'hashed-password')
      expect(mocks.emailSender.sendPasswordReset.mock.calls[0]?.[0]).toMatchObject({
        to: 'agent@test.com',
        companyName: 'Seguros MX',
        resetUrl: 'https://app.test/reset-password?token=reset-token',
      })
    })

    it('should send nothing for an unknown email without throwing', async () => {
      await authService.forgotPassword('unknown@test.com')

      expect(mocks.emailSender.sendPasswordReset).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('should hash and persist the new password', async () => {
      const user = createMockUser()
      mocks.jwtService.verifyPasswordResetToken.mockResolvedValue({
        sub: 'user-1',
        pwd: 'fp:hashed-password',
      })
      mocks.authUserProvider.findActiveById.mockResolvedValue(user)
      mocks.passwordHasher.hash.mockResolvedValue('new-hash')

      await authService.resetPassword({ token: 'reset-token', password: 'newPassword123' })

      expect(mocks.passwordHasher.hash).toHaveBeenCalledWith('newPassword123')
      expect(mocks.authUserProvider.updatePasswordHash).toHaveBeenCalledWith('user-1', 'new-hash')
    })

    it('should throw UnauthorizedError for an invalid token', async () => {
      expect(
        authService.resetPassword({ token: 'bad-token', password: 'newPassword123' }),
      ).rejects.toThrow(UnauthorizedError)
    })

    it('should throw UnauthorizedError when the token was already used', async () => {
      mocks.jwtService.verifyPasswordResetToken.mockResolvedValue({
        sub: 'user-1',
        pwd: 'fp:old-password-hash',
      })
      mocks.authUserProvider.findActiveById.mockResolvedValue(createMockUser())

      expect(
        authService.resetPassword({ token: 'reset-token', password: 'newPassword123' }),
      ).rejects.toThrow(UnauthorizedError)
      expect(mocks.authUserProvider.updatePasswordHash).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedError when the user is no longer active', async () => {
      mocks.jwtService.verifyPasswordResetToken.mockResolvedValue({
        sub: 'user-1',
        pwd: 'fp:hashed-password',
      })
      mocks.authUserProvider.findActiveById.mockResolvedValue(
        createMockUser({ status: ResourceStatus.INACTIVE }),
      )

      expect(
        authService.resetPassword({ token: 'reset-token', password: 'newPassword123' }),
      ).rejects.toThrow(UnauthorizedError)
    })
  })
})
