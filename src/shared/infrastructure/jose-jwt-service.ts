import { jwtVerify, SignJWT } from 'jose'
import type {
  JwtPayload,
  JwtService,
  JwtTokenPair,
  PasswordResetClaims,
} from '@/shared/domain/jwt-service'

interface JwtConfig {
  secret: string
  accessExpiration: string
  refreshExpiration: string
  passwordResetExpiration: string
}

const PASSWORD_RESET_TYPE = 'pwd_reset'

export class JoseJwtService implements JwtService {
  private readonly encodedSecret: Uint8Array

  constructor(private readonly config: JwtConfig) {
    this.encodedSecret = new TextEncoder().encode(config.secret)
  }

  async signAccessToken(payload: JwtPayload): Promise<string> {
    return this.sign(payload, this.config.accessExpiration)
  }

  async signRefreshToken(payload: JwtPayload): Promise<string> {
    return this.sign(payload, this.config.refreshExpiration)
  }

  async signTokenPair(payload: JwtPayload): Promise<JwtTokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ])
    return { accessToken, refreshToken }
  }

  async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    return this.verify(token)
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload | null> {
    return this.verify(token)
  }

  async signPasswordResetToken(userId: string, passwordHash: string): Promise<string> {
    return new SignJWT({
      typ: PASSWORD_RESET_TYPE,
      pwd: await this.passwordFingerprint(passwordHash),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(this.config.passwordResetExpiration)
      .sign(this.encodedSecret)
  }

  async verifyPasswordResetToken(token: string): Promise<PasswordResetClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.encodedSecret)

      if (payload.typ !== PASSWORD_RESET_TYPE || !payload.sub || typeof payload.pwd !== 'string') {
        return null
      }

      return { sub: payload.sub, pwd: payload.pwd }
    } catch {
      return null
    }
  }

  // Deriva un identificador estable del hash actual: al cambiar la contraseña el
  // token deja de validar, lo que lo vuelve de un solo uso sin tabla en BD.
  async passwordFingerprint(passwordHash: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(passwordHash))
    return Buffer.from(digest).toString('base64url').slice(0, 22)
  }

  private async sign(payload: JwtPayload, expiration: string): Promise<string> {
    return new SignJWT({ role: payload.role, companyId: payload.companyId })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.sub)
      .setIssuedAt()
      .setExpirationTime(expiration)
      .sign(this.encodedSecret)
  }

  private async verify(token: string): Promise<JwtPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.encodedSecret)

      if (!payload.sub || typeof payload.role !== 'string') {
        return null
      }

      const companyId = typeof payload.companyId === 'string' ? payload.companyId : null
      return { sub: payload.sub, role: payload.role, companyId }
    } catch {
      return null
    }
  }
}
