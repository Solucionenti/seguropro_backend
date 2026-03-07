import { jwtVerify, SignJWT } from 'jose'
import type { JwtPayload, JwtService, JwtTokenPair } from '@/shared/domain/jwt-service'

interface JwtConfig {
  secret: string
  accessExpiration: string
  refreshExpiration: string
}

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
