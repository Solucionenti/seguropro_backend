import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus, SuscripcionStatus, UserRole } from '@gen/enums'
import { CompanyUserService } from '@/modules/user/application/company-user-service'
import type { DetalleCliente, User, UserWithDetalle } from '@/modules/user/domain/entities'
import type { UserRepository } from '@/modules/user/domain/repository'
import type { SuscripcionPlanProvider } from '@/modules/user/domain/suscripcion-plan-provider'
import { ForbiddenError } from '@/shared/domain/forbidden-error'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import type { PasswordHasher } from '@/shared/domain/password-hasher'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)

// ── Factories ────────────────────────────────────────────

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    companyId: 'company-1',
    role: UserRole.AGENT,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@company.com',
    phone: '5550001111',
    lastLoginAt: null,
    active: true,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

function createMockDetalle(overrides: Partial<DetalleCliente> = {}): DetalleCliente {
  return {
    id: 'detalle-1',
    userId: 'user-1',
    fechaNacimiento: null,
    rfc: null,
    curp: null,
    direccion: null,
    ciudad: null,
    estado: null,
    codigoPostal: null,
    notas: null,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

function createMockUserWithDetalle(overrides: Partial<UserWithDetalle> = {}): UserWithDetalle {
  return { ...createMockUser(), detalleCliente: null, ...overrides }
}

// ── Mocks ────────────────────────────────────────────────

function createMocks() {
  const repo: Mocked<UserRepository> = {
    findById: mock(() => Promise.resolve(null)),
    findByCompanyId: mock(() => Promise.resolve(Page.empty<User>(defaultPageable))),
    findByEmailAndCompany: mock(() => Promise.resolve(null)),
    findMasterAdminByEmail: mock(() => Promise.resolve(null)),
    findMasterAdminOrOwnerByEmail: mock(() => Promise.resolve(null)),
    findCompaniesByEmail: mock(() => Promise.resolve([])),
    findAllMasterAdmins: mock(() => Promise.resolve(Page.empty<User>(defaultPageable))),
    findAllOwners: mock(() => Promise.resolve(Page.empty(defaultPageable))),
    findOwnerByEmail: mock(() => Promise.resolve(null)),
    findOwnerWithCompany: mock(() => Promise.resolve(null)),
    findCompleteOwner: mock(() => Promise.resolve(null)),
    countActiveMasterAdmins: mock(() => Promise.resolve(1)),
    countActiveCompanyUsers: mock(() => Promise.resolve(0)),
    findCompanyUsers: mock(() => Promise.resolve(Page.empty<User>(defaultPageable))),
    findCompanyUserById: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockUser())),
    createOwnerWithCompany: mock(() => Promise.resolve({ ...createMockUser(), company: null })),
    createCompanyUser: mock(() => Promise.resolve(createMockUserWithDetalle())),
    update: mock(() => Promise.resolve(createMockUser())),
    updateCompanyUserWithDetalle: mock(() => Promise.resolve(createMockUserWithDetalle())),
    softDelete: mock(() => Promise.resolve()),
    deactivateUser: mock(() => Promise.resolve()),
  }

  const passwordHasher: Mocked<PasswordHasher> = {
    hash: mock(() => Promise.resolve('hashed-pw')),
    verify: mock(() => Promise.resolve(true)),
  }

  const suscripcionPlanProvider: Mocked<SuscripcionPlanProvider> = {
    findActivePlanByCompany: mock(() =>
      Promise.resolve({ limiteUsuarios: 10, suscripcionStatus: SuscripcionStatus.ACTIVA }),
    ),
  }

  return { repo, passwordHasher, suscripcionPlanProvider }
}

// ── Tests ────────────────────────────────────────────────

describe('CompanyUserService', () => {
  let service: CompanyUserService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new CompanyUserService(
      mocks.repo,
      mocks.passwordHasher,
      mocks.suscripcionPlanProvider,
    )
  })

  // ── listCompanyUsers ─────────────────────────────────

  describe('listCompanyUsers', () => {
    it('OWNER receives AGENT and CLIENT roles', async () => {
      await service.listCompanyUsers('company-1', UserRole.OWNER, defaultPageable)
      expect(mocks.repo.findCompanyUsers).toHaveBeenCalledWith('company-1', defaultPageable, [
        UserRole.AGENT,
        UserRole.CLIENT,
      ])
    })

    it('AGENT receives AGENT and CLIENT roles', async () => {
      await service.listCompanyUsers('company-1', UserRole.AGENT, defaultPageable)
      expect(mocks.repo.findCompanyUsers).toHaveBeenCalledWith('company-1', defaultPageable, [
        UserRole.AGENT,
        UserRole.CLIENT,
      ])
    })
  })

  // ── createAgent ──────────────────────────────────────

  describe('createAgent', () => {
    const input = {
      firstName: 'New',
      lastName: 'Agent',
      email: 'agent@company.com',
      phone: '5551112222',
      password: 'password123',
    }

    it('creates AGENT when subscription is active and under limit', async () => {
      const expected = createMockUserWithDetalle({ role: UserRole.AGENT })
      mocks.repo.createCompanyUser.mockResolvedValue(expected)

      const result = await service.createAgent('company-1', input)

      expect(result).toBe(expected)
      expect(mocks.passwordHasher.hash).toHaveBeenCalledWith('password123')
      expect(mocks.repo.createCompanyUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.AGENT, companyId: 'company-1' }),
      )
    })

    it('throws ValidationError when no active subscription', async () => {
      mocks.suscripcionPlanProvider.findActivePlanByCompany.mockResolvedValue(null)

      await expect(service.createAgent('company-1', input)).rejects.toBeInstanceOf(ValidationError)
    })

    it('throws ValidationError when subscription status is CANCELADA', async () => {
      mocks.suscripcionPlanProvider.findActivePlanByCompany.mockResolvedValue({
        limiteUsuarios: 10,
        suscripcionStatus: SuscripcionStatus.CANCELADA,
      })

      await expect(service.createAgent('company-1', input)).rejects.toBeInstanceOf(ValidationError)
    })

    it('throws ValidationError when user limit is reached', async () => {
      mocks.suscripcionPlanProvider.findActivePlanByCompany.mockResolvedValue({
        limiteUsuarios: 5,
        suscripcionStatus: SuscripcionStatus.ACTIVA,
      })
      mocks.repo.countActiveCompanyUsers.mockResolvedValue(5)

      await expect(service.createAgent('company-1', input)).rejects.toBeInstanceOf(ValidationError)
    })

    it('throws ValidationError when email already exists in company', async () => {
      mocks.repo.findByEmailAndCompany.mockResolvedValue(createMockUser())

      await expect(service.createAgent('company-1', input)).rejects.toBeInstanceOf(ValidationError)
    })
  })

  // ── createClient ─────────────────────────────────────

  describe('createClient', () => {
    const input = {
      firstName: 'New',
      lastName: 'Client',
      email: 'client@company.com',
      phone: '5553334444',
      password: 'password123',
    }

    it('creates CLIENT without detalle', async () => {
      const expected = createMockUserWithDetalle({ role: UserRole.CLIENT })
      mocks.repo.createCompanyUser.mockResolvedValue(expected)

      const result = await service.createClient('company-1', input)

      expect(result).toBe(expected)
      expect(mocks.repo.createCompanyUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.CLIENT }),
        undefined,
      )
    })

    it('creates CLIENT with detalle', async () => {
      const detalle = { rfc: 'XAXX010101000', ciudad: 'CDMX' }
      const expected = createMockUserWithDetalle({
        role: UserRole.CLIENT,
        detalleCliente: createMockDetalle({ rfc: 'XAXX010101000', ciudad: 'CDMX' }),
      })
      mocks.repo.createCompanyUser.mockResolvedValue(expected)

      const result = await service.createClient('company-1', { ...input, detalle })

      expect(result).toBe(expected)
      expect(mocks.repo.createCompanyUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.CLIENT }),
        detalle,
      )
    })

    it('throws ValidationError when user limit is reached', async () => {
      mocks.repo.countActiveCompanyUsers.mockResolvedValue(10)
      mocks.suscripcionPlanProvider.findActivePlanByCompany.mockResolvedValue({
        limiteUsuarios: 10,
        suscripcionStatus: SuscripcionStatus.ACTIVA,
      })

      await expect(service.createClient('company-1', input)).rejects.toBeInstanceOf(ValidationError)
    })
  })

  // ── getCompanyUser ───────────────────────────────────

  describe('getCompanyUser', () => {
    it('OWNER can get an AGENT user', async () => {
      const agent = createMockUserWithDetalle({ role: UserRole.AGENT })
      mocks.repo.findCompanyUserById.mockResolvedValue(agent)

      const result = await service.getCompanyUser('company-1', 'user-1', UserRole.OWNER)

      expect(result).toBe(agent)
    })

    it('AGENT can get another AGENT user', async () => {
      const agent = createMockUserWithDetalle({ role: UserRole.AGENT })
      mocks.repo.findCompanyUserById.mockResolvedValue(agent)

      const result = await service.getCompanyUser('company-1', 'user-1', UserRole.AGENT)

      expect(result).toBe(agent)
    })

    it('AGENT cannot get the OWNER', async () => {
      mocks.repo.findCompanyUserById.mockResolvedValue(
        createMockUserWithDetalle({ role: UserRole.OWNER }),
      )

      await expect(
        service.getCompanyUser('company-1', 'user-1', UserRole.AGENT),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('throws NotFoundError when user not found', async () => {
      mocks.repo.findCompanyUserById.mockResolvedValue(null)

      await expect(
        service.getCompanyUser('company-1', 'unknown', UserRole.OWNER),
      ).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  // ── updateCompanyUser ────────────────────────────────

  describe('updateCompanyUser', () => {
    it('updates AGENT user without passing detalle to repo', async () => {
      const agent = createMockUserWithDetalle({ role: UserRole.AGENT })
      mocks.repo.findCompanyUserById.mockResolvedValue(agent)

      await service.updateCompanyUser('company-1', 'user-1', UserRole.OWNER, {
        firstName: 'Updated',
        detalle: { rfc: 'XAXX010101000' },
      })

      expect(mocks.repo.updateCompanyUserWithDetalle).toHaveBeenCalledWith(
        'user-1',
        { firstName: 'Updated' },
        undefined,
      )
    })

    it('updates CLIENT user including detalle', async () => {
      const client = createMockUserWithDetalle({ role: UserRole.CLIENT })
      mocks.repo.findCompanyUserById.mockResolvedValue(client)
      const detalle = { ciudad: 'Monterrey' }

      await service.updateCompanyUser('company-1', 'user-1', UserRole.OWNER, {
        firstName: 'Updated',
        detalle,
      })

      expect(mocks.repo.updateCompanyUserWithDetalle).toHaveBeenCalledWith(
        'user-1',
        { firstName: 'Updated' },
        detalle,
      )
    })

    it('AGENT updates a CLIENT user', async () => {
      mocks.repo.findCompanyUserById.mockResolvedValue(
        createMockUserWithDetalle({ role: UserRole.CLIENT }),
      )

      await service.updateCompanyUser('company-1', 'user-1', UserRole.AGENT, { firstName: 'X' })

      expect(mocks.repo.updateCompanyUserWithDetalle).toHaveBeenCalled()
    })

    it('AGENT cannot update another AGENT (403, not 404)', async () => {
      mocks.repo.findCompanyUserById.mockResolvedValue(
        createMockUserWithDetalle({ role: UserRole.AGENT }),
      )

      await expect(
        service.updateCompanyUser('company-1', 'user-1', UserRole.AGENT, { firstName: 'X' }),
      ).rejects.toBeInstanceOf(ForbiddenError)
      expect(mocks.repo.updateCompanyUserWithDetalle).not.toHaveBeenCalled()
    })

    it('AGENT cannot update the OWNER (403, not 404)', async () => {
      mocks.repo.findCompanyUserById.mockResolvedValue(
        createMockUserWithDetalle({ role: UserRole.OWNER }),
      )

      await expect(
        service.updateCompanyUser('company-1', 'user-1', UserRole.AGENT, { firstName: 'X' }),
      ).rejects.toBeInstanceOf(ForbiddenError)
      expect(mocks.repo.updateCompanyUserWithDetalle).not.toHaveBeenCalled()
    })
  })

  // ── deactivateCompanyUser ────────────────────────────

  describe('deactivateCompanyUser', () => {
    it('OWNER deactivates an AGENT', async () => {
      mocks.repo.findCompanyUserById.mockResolvedValue(
        createMockUserWithDetalle({ role: UserRole.AGENT }),
      )

      await service.deactivateCompanyUser('company-1', 'user-1', UserRole.OWNER)

      expect(mocks.repo.deactivateUser).toHaveBeenCalledWith('user-1')
    })

    it('AGENT deactivates a CLIENT user', async () => {
      mocks.repo.findCompanyUserById.mockResolvedValue(
        createMockUserWithDetalle({ role: UserRole.CLIENT }),
      )

      await service.deactivateCompanyUser('company-1', 'user-1', UserRole.AGENT)

      expect(mocks.repo.deactivateUser).toHaveBeenCalledWith('user-1')
    })

    it('AGENT cannot deactivate another AGENT (403, not 404)', async () => {
      mocks.repo.findCompanyUserById.mockResolvedValue(
        createMockUserWithDetalle({ role: UserRole.AGENT }),
      )

      await expect(
        service.deactivateCompanyUser('company-1', 'user-1', UserRole.AGENT),
      ).rejects.toBeInstanceOf(ForbiddenError)
      expect(mocks.repo.deactivateUser).not.toHaveBeenCalled()
    })

    it('AGENT cannot deactivate the OWNER (403, not 404)', async () => {
      mocks.repo.findCompanyUserById.mockResolvedValue(
        createMockUserWithDetalle({ role: UserRole.OWNER }),
      )

      await expect(
        service.deactivateCompanyUser('company-1', 'user-1', UserRole.AGENT),
      ).rejects.toBeInstanceOf(ForbiddenError)
      expect(mocks.repo.deactivateUser).not.toHaveBeenCalled()
    })
  })
})
