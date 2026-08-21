import { SuscripcionStatus, UserRole } from '@gen/enums'
import { ForbiddenError } from '@/shared/domain/forbidden-error'
import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { PasswordHasher } from '@/shared/domain/password-hasher'
import { ValidationError } from '@/shared/domain/validation-error'
import type {
  CreateAgentInput,
  CreateClientInput,
  ICompanyUserService,
  UpdateCompanyUserInput,
} from '../domain/company-user-service'
import type { User, UserWithDetalle } from '../domain/entities'
import type { UserRepository } from '../domain/repository'
import type { SuscripcionPlanProvider } from '../domain/suscripcion-plan-provider'

const ACTIVE_SUBSCRIPTION_STATUSES: SuscripcionStatus[] = [
  SuscripcionStatus.TRIAL,
  SuscripcionStatus.ACTIVA,
]

const ROLES_MANAGED_BY_OWNER: UserRole[] = [UserRole.AGENT, UserRole.CLIENT]
// an agent sees its peers but only ever writes to clients
const ROLES_READABLE_BY_AGENT: UserRole[] = [UserRole.AGENT, UserRole.CLIENT]
const ROLES_WRITABLE_BY_AGENT: UserRole[] = [UserRole.CLIENT]

export class CompanyUserService implements ICompanyUserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly suscripcionPlanProvider: SuscripcionPlanProvider,
  ) {}

  private async validatePlanLimit(companyId: string): Promise<void> {
    const planInfo = await this.suscripcionPlanProvider.findActivePlanByCompany(companyId)
    if (!planInfo) {
      throw new ValidationError('No active subscription found for this company')
    }
    if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(planInfo.suscripcionStatus)) {
      throw new ValidationError('Subscription must have status TRIAL or ACTIVA to manage users')
    }
    const count = await this.repo.countActiveCompanyUsers(companyId)
    if (count >= planInfo.limiteUsuarios) {
      throw new ValidationError(`User limit of ${planInfo.limiteUsuarios} reached for this plan`)
    }
  }

  private getReadableRoles(requestorRole: UserRole): UserRole[] {
    return requestorRole === UserRole.OWNER ? ROLES_MANAGED_BY_OWNER : ROLES_READABLE_BY_AGENT
  }

  private getWritableRoles(requestorRole: UserRole): UserRole[] {
    return requestorRole === UserRole.OWNER ? ROLES_MANAGED_BY_OWNER : ROLES_WRITABLE_BY_AGENT
  }

  // write access is checked against the target role alone, never against what the
  // requestor may read, so an agent aiming at an agent or at the owner gets 403 not 404
  private async findWritableCompanyUser(
    companyId: string,
    id: string,
    requestorRole: UserRole,
  ): Promise<UserWithDetalle> {
    const user = await this.repo.findCompanyUserById(companyId, id)
    if (!user) throw new NotFoundError('User', id)

    if (!this.getWritableRoles(requestorRole).includes(user.role)) {
      throw new ForbiddenError(`Your role cannot modify ${user.role} users`)
    }

    return user
  }

  async listCompanyUsers(
    companyId: string,
    requestorRole: UserRole,
    pageable: Pageable,
  ): Promise<Page<User>> {
    const roles = this.getReadableRoles(requestorRole)
    return this.repo.findCompanyUsers(companyId, pageable, roles)
  }

  async listCompanyAgents(companyId: string, pageable: Pageable): Promise<Page<User>> {
    return this.repo.findCompanyUsers(companyId, pageable, [UserRole.AGENT])
  }

  async listCompanyClients(companyId: string, pageable: Pageable): Promise<Page<User>> {
    return this.repo.findCompanyUsers(companyId, pageable, [UserRole.CLIENT])
  }

  async createAgent(companyId: string, input: CreateAgentInput): Promise<UserWithDetalle> {
    await this.validatePlanLimit(companyId)

    const existing = await this.repo.findByEmailAndCompany(input.email, companyId)
    if (existing) {
      throw new ValidationError('A user with this email already exists in this company')
    }

    const passwordHash = await this.passwordHasher.hash(input.password)
    return this.repo.createCompanyUser({
      companyId,
      role: UserRole.AGENT,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash,
    })
  }

  async createClient(companyId: string, input: CreateClientInput): Promise<UserWithDetalle> {
    await this.validatePlanLimit(companyId)

    const existing = await this.repo.findByEmailAndCompany(input.email, companyId)
    if (existing) {
      throw new ValidationError('A user with this email already exists in this company')
    }

    const passwordHash = await this.passwordHasher.hash(input.password)
    return this.repo.createCompanyUser(
      {
        companyId,
        role: UserRole.CLIENT,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        passwordHash,
      },
      input.detalle,
    )
  }

  async getCompanyUser(
    companyId: string,
    id: string,
    requestorRole: UserRole,
  ): Promise<UserWithDetalle> {
    const user = await this.repo.findCompanyUserById(companyId, id)
    if (!user) throw new NotFoundError('User', id)

    const allowedRoles = this.getReadableRoles(requestorRole)
    if (!allowedRoles.includes(user.role)) throw new NotFoundError('User', id)

    return user
  }

  async updateCompanyUser(
    companyId: string,
    id: string,
    requestorRole: UserRole,
    input: UpdateCompanyUserInput,
  ): Promise<UserWithDetalle> {
    const user = await this.findWritableCompanyUser(companyId, id, requestorRole)
    const { detalle, ...userInput } = input
    const detalleToUpdate = user.role === UserRole.CLIENT ? detalle : undefined
    return this.repo.updateCompanyUserWithDetalle(id, userInput, detalleToUpdate)
  }

  async deactivateCompanyUser(
    companyId: string,
    id: string,
    requestorRole: UserRole,
  ): Promise<void> {
    await this.findWritableCompanyUser(companyId, id, requestorRole)
    return this.repo.deactivateUser(id)
  }
}
