import { UserRole } from '@gen/enums'
import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { PasswordHasher } from '@/shared/domain/password-hasher'
import { ValidationError } from '@/shared/domain/validation-error'
import type { UpdateProfileInput, UpdateUserInput, User, UserWithCompany } from '../domain/entities'
import type { UserRepository } from '../domain/repository'
import type { CreateAdminInput, CreateOwnerInput, IUserService } from '../domain/service'

export class UserService implements IUserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  // ── Admin CRUD ─────────────────────────────────────────

  async listAdmins(pageable: Pageable): Promise<Page<User>> {
    return this.repo.findAllMasterAdmins(pageable)
  }

  async createAdmin(input: CreateAdminInput): Promise<User> {
    const existing = await this.repo.findMasterAdminByEmail(input.email)
    if (existing) {
      throw new ValidationError('A MASTER_ADMIN with this email already exists')
    }

    const passwordHash = await this.passwordHasher.hash(input.password)

    return this.repo.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: UserRole.MASTER_ADMIN,
      companyId: null,
    })
  }

  async getAdmin(id: string): Promise<User> {
    const user = await this.repo.findById(id)
    if (!user || user.role !== UserRole.MASTER_ADMIN) {
      throw new NotFoundError('Admin', id)
    }
    return user
  }

  async updateAdmin(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.getAdmin(id)
    return this.repo.update(user.id, input)
  }

  async deleteAdmin(id: string): Promise<void> {
    await this.getAdmin(id)

    const activeCount = await this.repo.countActiveMasterAdmins()
    if (activeCount <= 1) {
      throw new ValidationError('Cannot delete the last active MASTER_ADMIN')
    }

    return this.repo.softDelete(id)
  }

  // ── Owner CRUD ─────────────────────────────────────────

  async listOwners(pageable: Pageable): Promise<Page<UserWithCompany>> {
    return this.repo.findAllOwners(pageable)
  }

  async createOwner(input: CreateOwnerInput): Promise<UserWithCompany> {
    const existing = await this.repo.findMasterAdminOrOwnerByEmail(input.email)
    if (existing) {
      throw new ValidationError('An user admin or owner with this email already exists')
    }

    const passwordHash = await this.passwordHasher.hash(input.password)

    return this.repo.createOwnerWithCompany(
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: UserRole.OWNER,
      },
      input.company,
    )
  }

  async getOwner(id: string): Promise<UserWithCompany> {
    const user = await this.repo.findCompleteOwner(id)
    if (!user || user.role !== UserRole.OWNER) {
      throw new NotFoundError('Owner', id)
    }
    return user
  }

  async updateOwner(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.repo.findById(id)
    if (!user || user.role !== UserRole.OWNER) {
      throw new NotFoundError('Owner', id)
    }
    return this.repo.update(user.id, input)
  }

  async deleteOwner(id: string): Promise<void> {
    const user = await this.repo.findById(id)
    if (!user || user.role !== UserRole.OWNER) {
      throw new NotFoundError('Owner', id)
    }
    return this.repo.softDelete(id)
  }

  // ── Profile (self-service) ─────────────────────────────

  async getProfile(userId: string): Promise<User> {
    const user = await this.repo.findById(userId)
    if (!user) {
      throw new NotFoundError('User', userId)
    }
    return user
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
    await this.getProfile(userId)
    return this.repo.update(userId, input)
  }

  // ── Auth-related (used by auth module) ─────────────────

  async findByEmailAndCompany(email: string, companyId: string): Promise<User | null> {
    return this.repo.findByEmailAndCompany(email, companyId)
  }

  async findMasterAdminByEmail(email: string): Promise<User | null> {
    return this.repo.findMasterAdminByEmail(email)
  }

  async findCompaniesByEmail(email: string) {
    return this.repo.findCompaniesByEmail(email)
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findById(id)
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    return this.repo.update(id, input)
  }
}
