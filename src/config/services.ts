import { Elysia } from 'elysia'
import { prisma } from '@/config/database'
import { envConfig } from '@/config/env'
import { ArchivoPolizaService } from '@/modules/archivo-poliza/application/service'
import { PrismaPolizaProvider as PrismaArchivoPolizaProvider } from '@/modules/archivo-poliza/infrastructure/prisma-poliza-provider'
import { PrismaArchivoPolizaRepository } from '@/modules/archivo-poliza/infrastructure/prisma-repo'
import { AseguradoraService } from '@/modules/aseguradora/application/service'
import { PrismaAseguradoraRepository } from '@/modules/aseguradora/infrastructure/prisma-repo'
import { AuthService } from '@/modules/auth/application/service'
import { PrismaAuthUserProvider } from '@/modules/auth/infrastructure/prisma-auth-user-provider'
import { ColumnaKanbanService } from '@/modules/columna-kanban/application/service'
import { PrismaColumnaKanbanRepository } from '@/modules/columna-kanban/infrastructure/prisma-repo'
import { CompanyService } from '@/modules/company/application/service'
import { PrismaCompanyRepository } from '@/modules/company/infrastructure/prisma-repo'
import { HealthService } from '@/modules/health/application/service'
import { PrismaHealthRepository } from '@/modules/health/infrastructure/prisma-repo'
import { OrdenService } from '@/modules/orden/application/service'
import { PrismaOrdenRepository } from '@/modules/orden/infrastructure/prisma-repo'
import { PrismaSuscripcionProvider } from '@/modules/orden/infrastructure/prisma-suscripcion-provider'
import { PlanService } from '@/modules/plan/application/service'
import { PrismaPlanRepository } from '@/modules/plan/infrastructure/prisma-repo'
import { PolizaService } from '@/modules/poliza/application/service'
import { PrismaAseguradoraProvider } from '@/modules/poliza/infrastructure/prisma-aseguradora-provider'
import { PrismaClienteUserProvider } from '@/modules/poliza/infrastructure/prisma-cliente-user-provider'
import { PrismaKanbanProvider } from '@/modules/poliza/infrastructure/prisma-kanban-provider'
import { PrismaRamoProvider } from '@/modules/poliza/infrastructure/prisma-ramo-provider'
import { PrismaPolizaRepository } from '@/modules/poliza/infrastructure/prisma-repo'
import { RamoService } from '@/modules/ramo/application/service'
import { PrismaRamoRepository } from '@/modules/ramo/infrastructure/prisma-repo'
import { SiniestroService } from '@/modules/siniestro/application/service'
import { PrismaPolizaProvider } from '@/modules/siniestro/infrastructure/prisma-poliza-provider'
import { PrismaSiniestroRepository } from '@/modules/siniestro/infrastructure/prisma-repo'
import { SuscripcionService } from '@/modules/suscripcion/application/service'
import { PrismaCompanyProvider } from '@/modules/suscripcion/infrastructure/prisma-company-provider'
import { PrismaPlanProvider } from '@/modules/suscripcion/infrastructure/prisma-plan-provider'
import { PrismaSuscripcionRepository } from '@/modules/suscripcion/infrastructure/prisma-repo'
import { CompanyUserService } from '@/modules/user/application/company-user-service'
import { UserService } from '@/modules/user/application/service'
import { PrismaUserRepository } from '@/modules/user/infrastructure/prisma-repo'
import { PrismaSuscripcionPlanProvider } from '@/modules/user/infrastructure/prisma-suscripcion-plan-provider'
import { BunPasswordHasher } from '@/shared/infrastructure/bun-password-hasher'
import { JoseJwtService } from '@/shared/infrastructure/jose-jwt-service'
import { ResendEmailSender } from '@/shared/infrastructure/resend-email-sender'

// --- Instantiation (wiring) ---

const aseguradoraRepo = new PrismaAseguradoraRepository(prisma)
const columnaKanbanRepo = new PrismaColumnaKanbanRepository(prisma)
const authUserProvider = new PrismaAuthUserProvider(prisma)
const userRepo = new PrismaUserRepository(prisma)
const healthRepo = new PrismaHealthRepository(prisma)
const planRepo = new PrismaPlanRepository(prisma)
const companyProvider = new PrismaCompanyProvider(prisma)
const planProvider = new PrismaPlanProvider(prisma)
const suscripcionRepo = new PrismaSuscripcionRepository(prisma)
const suscripcionProvider = new PrismaSuscripcionProvider(prisma)
const ordenRepo = new PrismaOrdenRepository(prisma)
const ramoRepo = new PrismaRamoRepository(prisma)
const polizaRepo = new PrismaPolizaRepository(prisma)
const polizaAseguradoraProvider = new PrismaAseguradoraProvider(prisma)
const polizaRamoProvider = new PrismaRamoProvider(prisma)
const polizaClienteProvider = new PrismaClienteUserProvider(prisma)
const polizaKanbanProvider = new PrismaKanbanProvider(prisma)
const companyRepo = new PrismaCompanyRepository(prisma)
const siniestroRepo = new PrismaSiniestroRepository(prisma)
const siniestroPolizaProvider = new PrismaPolizaProvider(prisma)
const archivoPolizaRepo = new PrismaArchivoPolizaRepository(prisma)
const archivoPolizaProvider = new PrismaArchivoPolizaProvider(prisma)
const passwordHasher = new BunPasswordHasher()
const jwtService = new JoseJwtService({
  secret: envConfig.JWT_SECRET,
  accessExpiration: envConfig.JWT_ACCESS_EXPIRATION,
  refreshExpiration: envConfig.JWT_REFRESH_EXPIRATION,
  passwordResetExpiration: envConfig.PASSWORD_RESET_EXPIRATION,
})
const emailSender = new ResendEmailSender({
  apiKey: envConfig.RESEND_API_KEY,
  from: envConfig.EMAIL_FROM,
})
const suscripcionPlanProvider = new PrismaSuscripcionPlanProvider(prisma)
const aseguradoraService = new AseguradoraService(aseguradoraRepo)
const columnaKanbanService = new ColumnaKanbanService(columnaKanbanRepo)
const userService = new UserService(userRepo, passwordHasher)
const companyUserService = new CompanyUserService(userRepo, passwordHasher, suscripcionPlanProvider)
const healthService = new HealthService(healthRepo)
const authService = new AuthService(authUserProvider, passwordHasher, jwtService, emailSender, {
  appUrl: envConfig.APP_URL,
  expiresIn: envConfig.PASSWORD_RESET_EXPIRATION,
})
const planService = new PlanService(planRepo)
const suscripcionService = new SuscripcionService(suscripcionRepo, companyProvider, planProvider)
const ordenService = new OrdenService(ordenRepo, suscripcionProvider)
const ramoService = new RamoService(ramoRepo)
const polizaService = new PolizaService(
  polizaRepo,
  polizaAseguradoraProvider,
  polizaRamoProvider,
  polizaClienteProvider,
  polizaKanbanProvider,
)
const companyService = new CompanyService(companyRepo)
const siniestroService = new SiniestroService(siniestroRepo, siniestroPolizaProvider)
const archivoPolizaService = new ArchivoPolizaService(archivoPolizaRepo, archivoPolizaProvider)

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

export const suscripcionServicePlugin = new Elysia({ name: '@app/services/suscripcion' }).decorate(
  'suscripcionService',
  suscripcionService,
)

export const ordenServicePlugin = new Elysia({ name: '@app/services/orden' }).decorate(
  'ordenService',
  ordenService,
)

export const aseguradoraServicePlugin = new Elysia({ name: '@app/services/aseguradora' }).decorate(
  'aseguradoraService',
  aseguradoraService,
)

export const columnaKanbanServicePlugin = new Elysia({
  name: '@app/services/columna-kanban',
}).decorate('columnaKanbanService', columnaKanbanService)

export const ramoServicePlugin = new Elysia({ name: '@app/services/ramo' }).decorate(
  'ramoService',
  ramoService,
)

export const polizaServicePlugin = new Elysia({ name: '@app/services/poliza' }).decorate(
  'polizaService',
  polizaService,
)

export const companyUserServicePlugin = new Elysia({
  name: '@app/services/company-user',
}).decorate('companyUserService', companyUserService)

export const companyServicePlugin = new Elysia({ name: '@app/services/company' }).decorate(
  'companyService',
  companyService,
)

export const siniestroServicePlugin = new Elysia({ name: '@app/services/siniestro' }).decorate(
  'siniestroService',
  siniestroService,
)

export const archivoPolizaServicePlugin = new Elysia({
  name: '@app/services/archivo-poliza',
}).decorate('archivoPolizaService', archivoPolizaService)
