export interface JwtPayload {
  sub: string
  role: string
  companyId: string | null
}

export interface JwtTokenPair {
  accessToken: string
  refreshToken: string
}

export interface JwtService {
  signAccessToken(payload: JwtPayload): Promise<string>
  signRefreshToken(payload: JwtPayload): Promise<string>
  signTokenPair(payload: JwtPayload): Promise<JwtTokenPair>
  verifyAccessToken(token: string): Promise<JwtPayload | null>
  verifyRefreshToken(token: string): Promise<JwtPayload | null>
}
