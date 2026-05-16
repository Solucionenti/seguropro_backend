import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus, UserRole } from '@gen/enums'
import { UserService } from '@/modules/user/application/service'
import type { CompanyInfo, User, UserWithCompany } from '@/modules/user/domain/entities'
import type { UserRepository } from '@/modules/user/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import type { PasswordHasher } from '@/shared/domain/password-hasher'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

// ── Factories ────────────────────────────────────────────

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'admin@test.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '1234567890',
    role: UserRole.MASTER_ADMIN,
    companyId: null,
    lastLoginAt: null,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

function createMockCompany(overrides: Partial<CompanyInfo> = {}): CompanyInfo {
  return {
    id: 'company-1',
    nombreComercial: 'Test Company',
    razonSocial: null,
    emailContacto: 'contact@company.com',
    telefonoContacto: '5551234567',
    ...overrides,
  }
}

function createMockOwnerWithCompany(overrides: Partial<UserWithCompany> = {}): UserWithCompany {
  return {
    ...createMockUser({ role: UserRole.OWNER, companyId: 'company-1' }),
    company: createMockCompany(),
    ...overrides,
  }
}

// ── Mocks ────────────────────────────────────────────────

function createMocks() {
  const repo: Mocked<UserRepository> = {
    findById: mock(() => Promise.resolve(null)),
    findByCompanyId: mock(() => Promise.resolve({ data: [], total: 0 })),
    findByEmailAndCompany: mock(() => Promise.resolve(null)),
    findMasterAdminByEmail: mock(() => Promise.resolve(null)),
    findCompaniesByEmail: mock(() => Promise.resolve([])),
    findAllMasterAdmins: mock(() => Promise.resolve({ data: [], total: 0 })),
    findAllOwners: mock(() => Promise.resolve({ data: [], total: 0 })),
    findOwnerByEmail: mock(() => Promise.resolve(null)),
    findOwnerWithCompany: mock(() => Promise.resolve(null)),
    findCompleteOwner: mock(() => Promise.resolve(null)),
    countActiveMasterAdmins: mock(() => Promise.resolve(1)),
    create: mock(() => Promise.resolve(createMockUser())),
    createOwnerWithCompany: mock(() => Promise.resolve(createMockOwnerWithCompany())),
    update: mock(() => Promise.resolve(createMockUser())),
    softDelete: mock(() => Promise.resolve()),
    findMasterAdminOrOwnerByEmail: mock(() => Promise.resolve(null)),
  }

  const passwordHasher: Mocked<PasswordHasher> = {
    hash: mock(() => Promise.resolve('hashed-password')),
    verify: mock(() => Promise.resolve(true)),
  }

  return { repo, passwordHasher }
}

// ── Tests ────────────────────────────────────────────────

describe('UserService', () => {
  let service: UserService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new UserService(mocks.repo, mocks.passwordHasher)
  })

  // ── Admin CRUD ───────────────────────────────────────

  describe('listAdmins', () => {
    it('should return paginated list of admins', async () => {
      const admins = [createMockUser(), createMockUser({ id: 'user-2', email: 'admin2@test.com' })]
      mocks.repo.findAllMasterAdmins.mockResolvedValue({ data: admins, total: 2 })

      const result = await service.listAdmins(1, 20)

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(mocks.repo.findAllMasterAdmins).toHaveBeenCalledWith(1, 20)
    })
  })

  describe('createAdmin', () => {
    it('should create a MASTER_ADMIN with hashed password', async () => {
      const input = {
        firstName: 'Jane',
        lastName: 'Admin',
        email: 'jane@test.com',
        phone: '5551234567',
        password: 'securepassword',
      }

      const created = createMockUser({ ...input, email: input.email })
      mocks.repo.create.mockResolvedValue(created)

      const result = await service.createAdmin(input)

      expect(mocks.passwordHasher.hash).toHaveBeenCalledWith('securepassword')
      expect(mocks.repo.create).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Admin',
        email: 'jane@test.com',
        phone: '5551234567',
        passwordHash: 'hashed-password',
        role: UserRole.MASTER_ADMIN,
        companyId: null,
      })
      expect(result.email).toBe('jane@test.com')
    })

    it('should throw ValidationError when email already exists', async () => {
      mocks.repo.findMasterAdminByEmail.mockResolvedValue(createMockUser())

      expect(
        service.createAdmin({
          firstName: 'Dup',
          lastName: 'Admin',
          email: 'admin@test.com',
          phone: '5551234567',
          password: 'securepassword',
        }),
      ).rejects.toBeInstanceOf(ValidationError)
    })
  })

  describe('getAdmin', () => {
    it('should return admin when found with MASTER_ADMIN role', async () => {
      const admin = createMockUser()
      mocks.repo.findById.mockResolvedValue(admin)

      const result = await service.getAdmin('user-1')

      expect(result.id).toBe('user-1')
      expect(result.role).toBe(UserRole.MASTER_ADMIN)
    })

    it('should throw NotFoundError when user is not MASTER_ADMIN', async () => {
      mocks.repo.findById.mockResolvedValue(createMockUser({ role: UserRole.OWNER }))

      expect(service.getAdmin('user-1')).rejects.toBeInstanceOf(NotFoundError)
    })

    it('should throw NotFoundError when user does not exist', async () => {
      expect(service.getAdmin('nonexistent')).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe('updateAdmin', () => {
    it('should update admin fields', async () => {
      const admin = createMockUser()
      mocks.repo.findById.mockResolvedValue(admin)
      const updated = createMockUser({ firstName: 'Updated' })
      mocks.repo.update.mockResolvedValue(updated)

      const result = await service.updateAdmin('user-1', { firstName: 'Updated' })

      expect(mocks.repo.update).toHaveBeenCalledWith('user-1', { firstName: 'Updated' })
      expect(result.firstName).toBe('Updated')
    })
  })

  describe('deleteAdmin', () => {
    it('should soft-delete admin when more than one active admin exists', async () => {
      const admin = createMockUser()
      mocks.repo.findById.mockResolvedValue(admin)
      mocks.repo.countActiveMasterAdmins.mockResolvedValue(2)

      await service.deleteAdmin('user-1')

      expect(mocks.repo.softDelete).toHaveBeenCalledWith('user-1')
    })

    it('should throw ValidationError when trying to delete the last active admin', async () => {
      const admin = createMockUser()
      mocks.repo.findById.mockResolvedValue(admin)
      mocks.repo.countActiveMasterAdmins.mockResolvedValue(1)

      expect(service.deleteAdmin('user-1')).rejects.toBeInstanceOf(ValidationError)
    })

    it('should throw NotFoundError when admin does not exist', async () => {
      expect(service.deleteAdmin('nonexistent')).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  // ── Owner CRUD ───────────────────────────────────────

  describe('listOwners', () => {
    it('should return paginated list of owners with company info', async () => {
      const owners = [createMockOwnerWithCompany()]
      mocks.repo.findAllOwners.mockResolvedValue({ data: owners, total: 1 })

      const result = await service.listOwners(1, 10)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]?.company?.nombreComercial).toBe('Test Company')
      expect(mocks.repo.findAllOwners).toHaveBeenCalledWith(1, 10)
    })
  })

  describe('createOwner', () => {
    it('should create owner with company in transaction', async () => {
      const input = {
        firstName: 'Owner',
        lastName: 'User',
        email: 'owner@test.com',
        phone: '5559876543',
        password: 'securepassword',
        company: {
          nombreComercial: 'New Corp',
          emailContacto: 'info@newcorp.com',
          telefonoContacto: '5551111111',
        },
      }

      const result = await service.createOwner(input)

      expect(mocks.passwordHasher.hash).toHaveBeenCalledWith('securepassword')
      expect(mocks.repo.createOwnerWithCompany).toHaveBeenCalledWith(
        {
          firstName: 'Owner',
          lastName: 'User',
          email: 'owner@test.com',
          phone: '5559876543',
          passwordHash: 'hashed-password',
          role: UserRole.OWNER,
        },
        input.company,
      )
      expect(result.company).toBeDefined()
    })

    it('should throw ValidationError when owner email already exists', async () => {
      mocks.repo.findMasterAdminOrOwnerByEmail.mockResolvedValue(
        createMockUser({ role: UserRole.OWNER }),
      )

      expect(
        service.createOwner({
          firstName: 'Dup',
          lastName: 'Owner',
          email: 'existing@test.com',
          phone: '5559876543',
          password: 'securepassword',
          company: {
            nombreComercial: 'Dup Corp',
            emailContacto: 'info@dup.com',
            telefonoContacto: '5552222222',
          },
        }),
      ).rejects.toBeInstanceOf(ValidationError)
    })
  })

  describe('getOwner', () => {
    it('should return owner with company info', async () => {
      const owner = createMockOwnerWithCompany()
      mocks.repo.findCompleteOwner.mockResolvedValue(owner)

      const result = await service.getOwner('user-1')

      expect(result.role).toBe(UserRole.OWNER)
      expect(result.company?.id).toBe('company-1')
    })

    it('should throw NotFoundError when owner not found', async () => {
      expect(service.getOwner('nonexistent')).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe('updateOwner', () => {
    it('should update owner fields', async () => {
      const owner = createMockUser({ role: UserRole.OWNER, companyId: 'company-1' })
      mocks.repo.findById.mockResolvedValue(owner)
      const updated = { ...owner, firstName: 'Updated' }
      mocks.repo.update.mockResolvedValue(updated)

      const result = await service.updateOwner('user-1', { firstName: 'Updated' })

      expect(result.firstName).toBe('Updated')
    })

    it('should throw NotFoundError when user is not OWNER', async () => {
      mocks.repo.findById.mockResolvedValue(createMockUser({ role: UserRole.MASTER_ADMIN }))

      expect(service.updateOwner('user-1', { firstName: 'X' })).rejects.toBeInstanceOf(
        NotFoundError,
      )
    })
  })

  describe('deleteOwner', () => {
    it('should soft-delete owner', async () => {
      const owner = createMockUser({ role: UserRole.OWNER, companyId: 'company-1' })
      mocks.repo.findById.mockResolvedValue(owner)

      await service.deleteOwner('user-1')

      expect(mocks.repo.softDelete).toHaveBeenCalledWith('user-1')
    })

    it('should throw NotFoundError when user is not OWNER', async () => {
      mocks.repo.findById.mockResolvedValue(createMockUser({ role: UserRole.AGENT }))

      expect(service.deleteOwner('user-1')).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  // ── Profile ──────────────────────────────────────────

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = createMockUser()
      mocks.repo.findById.mockResolvedValue(user)

      const result = await service.getProfile('user-1')

      expect(result.id).toBe('user-1')
    })

    it('should throw NotFoundError when user not found', async () => {
      expect(service.getProfile('nonexistent')).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe('updateProfile', () => {
    it('should update profile fields', async () => {
      const user = createMockUser()
      mocks.repo.findById.mockResolvedValue(user)
      const updated = createMockUser({ phone: '9999999999' })
      mocks.repo.update.mockResolvedValue(updated)

      const result = await service.updateProfile('user-1', { phone: '9999999999' })

      expect(mocks.repo.update).toHaveBeenCalledWith('user-1', { phone: '9999999999' })
      expect(result.phone).toBe('9999999999')
    })
  })
})
