import type { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { jwtServicePlugin } from '@/config/services'
import { ForbiddenError } from '@/shared/domain/forbidden-error'
import type { JwtService } from '@/shared/domain/jwt-service'
import { UnauthorizedError } from '@/shared/domain/unauthorized-error'
import { publicRouter } from '@/shared/routers/public-router'

async function resolveAuthUser(
  headers: Record<string, string | undefined>,
  jwtService: JwtService,
): Promise<{ userId: string; userRole: string; companyId: string | null }> {
  const authorization = headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header')
  }

  const token = authorization.slice(7)
  const payload = await jwtService.verifyAccessToken(token)

  if (!payload) {
    throw new UnauthorizedError('Invalid or expired token')
  }

  return { userId: payload.sub, userRole: payload.role, companyId: payload.companyId }
}

export const authRouter = new Elysia({ name: '@app/shared/auth-router' })
  .use(publicRouter)
  .use(jwtServicePlugin)
  .resolve(({ headers, jwtService }) => resolveAuthUser(headers, jwtService))
  .macro({
    withRole: (requiredRoles: UserRole | UserRole[]) => ({
      beforeHandle({ userRole }: { userRole?: string }) {
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
        if (!userRole || !roles.includes(userRole as UserRole)) {
          throw new ForbiddenError('Insufficient permissions')
        }
      },
    }),
  })
  .macro('requireCompany', {
    resolve({ companyId }) {
      if (!companyId) throw new ForbiddenError('This route requires a company-scoped account')
      return { companyId }
    },
  })
  .as('scoped')
