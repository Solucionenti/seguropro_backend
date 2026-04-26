import { Elysia } from 'elysia'
import { prisma } from '@/config/database'
import { envConfig } from '@/config/env'
import { AuthService } from '@/modules/auth/application/service'
import { PrismaAuthUserProvider } from '@/modules/auth/infrastructure/prisma-auth-user-provider'
import { HealthService } from '@/modules/health/application/service'
import { PrismaHealthRepository } from '@/modules/health/infrastructure/prisma-repo'
import { PlanService } from '@/modules/plan/application/service'
import { PrismaPlanRepository } from '@/modules/plan/infrastructure/prisma-repo'
import { UserService } from '@/modules/user/application/service'
import { PrismaUserRepository } from '@/modules/user/infrastructure/prisma-repo'
import { BunPasswordHasher } from '@/shared/infrastructure/bun-password-hasher'
import { JoseJwtService } from '@/shared/infrastructure/jose-jwt-service'

// --- Instantiation (wiring) ---

const authUserProvider = new PrismaAuthUserProvider(prisma)
const userRepo = new PrismaUserRepository(prisma)
const healthRepo = new PrismaHealthRepository(prisma)
const planRepo = new PrismaPlanRepository(prisma)
const passwordHasher = new BunPasswordHasher()
const jwtService = new JoseJwtService({
  secret: envConfig.JWT_SECRET,
  accessExpiration: envConfig.JWT_ACCESS_EXPIRATION,
  refreshExpiration: envConfig.JWT_REFRESH_EXPIRATION,
})
const userService = new UserService(userRepo, passwordHasher)
const healthService = new HealthService(healthRepo)
const authService = new AuthService(authUserProvider, passwordHasher, jwtService)
const planService = new PlanService(planRepo)

// --- Per-module Elysia service plugins ---
// Controllers `.use()` only the plugins they need.

export const jwtServicePlugin = new Elysia({ name: '@app/services/jwt' }).decorate(
  'jwtService',
  jwtService,
)

export const authServicePlugin = new Elysia({ name: '@app/services/auth' }).decorate(
  'authService',
  authService,
)

export const userServicePlugin = new Elysia({ name: '@app/services/user' }).decorate(
  'userService',
  userService,
)

export const healthServicePlugin = new Elysia({ name: '@app/services/health' }).decorate(
  'healthService',
  healthService,
)

export const planServicePlugin = new Elysia({ name: '@app/services/plan' }).decorate(
  'planService',
  planService,
)
