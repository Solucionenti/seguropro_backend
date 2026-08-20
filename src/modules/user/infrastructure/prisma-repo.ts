import { ResourceStatus, UserRole } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type {
  CompanyInput,
  CreateDetalleClienteInput,
  CreateUserInput,
  UpdateDetalleClienteInput,
  UpdateUserInput,
  User,
  UserWithCompany,
  UserWithDetalle,
} from '../domain/entities'
import type { UserRepository } from '../domain/repository'

const detalleSelect = {
  id: true,
  userId: true,
  fechaNacimiento: true,
  rfc: true,
  curp: true,
  direccion: true,
  ciudad: true,
  estado: true,
  codigoPostal: true,
  notas: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

const companySelect = {
  id: true,
  nombreComercial: true,
  razonSocial: true,
  emailContacto: true,
  telefonoContacto: true,
} as const

const completeInfo = {
  company: {
    include: {
      suscripciones: {
        include: {
          plan: true,
          ordenes: true,
        },
        where: { status: ResourceStatus.ACTIVE },
      },
    },
  },
} as const

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, status: ResourceStatus.ACTIVE },
    })
  }

  async findByCompanyId(companyId: string, pageable: Pageable): Promise<Page<User>> {
    const where = { companyId, status: ResourceStatus.ACTIVE }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.user.count({ where }),
    ])
    return Page.of(data, total, pageable)
  }

  async findByEmailAndCompany(email: string, companyId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, companyId, status: ResourceStatus.ACTIVE },
    })
  }

  async findMasterAdminByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, role: UserRole.MASTER_ADMIN, companyId: null, status: ResourceStatus.ACTIVE },
    })
  }

  async findMasterAdminOrOwnerByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        role: { in: [UserRole.MASTER_ADMIN, UserRole.OWNER] },
        status: ResourceStatus.ACTIVE,
      },
    })
  }

  async findCompaniesByEmail(
    email: string,
  ): Promise<{ companyId: string; nombreComercial: string | null }[]> {
    const users = await this.prisma.user.findMany({
      where: { email, status: ResourceStatus.ACTIVE, companyId: { not: null } },
      select: {
        companyId: true,
        company: {
          select: { id: true, nombreComercial: true },
        },
      },
    })

    return users
      .filter((u): u is typeof u & { companyId: string } => u.companyId !== null)
      .map((u) => ({
        companyId: u.companyId,
        nombreComercial: u.company?.nombreComercial ?? null,
      }))
  }

  async findAllMasterAdmins(pageable: Pageable): Promise<Page<User>> {
    const where = { role: UserRole.MASTER_ADMIN, status: ResourceStatus.ACTIVE }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.user.count({ where }),
    ])
    return Page.of(data, total, pageable)
  }

  async findAllOwners(pageable: Pageable): Promise<Page<UserWithCompany>> {
    const where = { role: UserRole.OWNER, status: ResourceStatus.ACTIVE }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
        include: { company: { select: companySelect } },
      }),
      this.prisma.user.count({ where }),
    ])
    return Page.of(data as UserWithCompany[], total, pageable)
  }

  async findOwnerByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, role: UserRole.OWNER, status: ResourceStatus.ACTIVE },
    })
  }

  async findOwnerWithCompany(id: string): Promise<UserWithCompany | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, role: UserRole.OWNER, status: ResourceStatus.ACTIVE },
      include: { company: { select: companySelect } },
    })
    return user as UserWithCompany | null
  }

  async findCompleteOwner(id: string): Promise<UserWithCompany | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, role: UserRole.OWNER, status: ResourceStatus.ACTIVE },
      include: completeInfo,
    })
    return user as UserWithCompany | null
  }

  async countActiveMasterAdmins(): Promise<number> {
    return this.prisma.user.count({
      where: { role: UserRole.MASTER_ADMIN, status: ResourceStatus.ACTIVE },
    })
  }

  async countActiveOwnersByCompany(companyId: string): Promise<number> {
    return this.prisma.user.count({
      where: {
        companyId,
        role: UserRole.OWNER,
        status: ResourceStatus.ACTIVE,
        active: true,
      },
    })
  }

  async isCompanyActive(companyId: string): Promise<boolean> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, status: ResourceStatus.ACTIVE },
      select: { id: true },
    })

    return company !== null
  }

  async create(input: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        companyId: input.companyId ?? null,
        role: input.role ?? UserRole.AGENT,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        passwordHash: input.passwordHash,
      },
    })
  }

  async createOwnerWithCompany(
    userInput: CreateUserInput,
    companyInput: CompanyInput,
  ): Promise<UserWithCompany> {
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          nombreComercial: companyInput.nombreComercial,
          razonSocial: companyInput.razonSocial ?? null,
          emailContacto: companyInput.emailContacto,
          telefonoContacto: companyInput.telefonoContacto,
        },
        select: companySelect,
      })

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          role: UserRole.OWNER,
          firstName: userInput.firstName,
          lastName: userInput.lastName,
          email: userInput.email,
          phone: userInput.phone,
          passwordHash: userInput.passwordHash,
        },
      })

      return { ...user, company } as UserWithCompany
    })
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: input,
    })
  }

  async countActiveCompanyUsers(companyId: string): Promise<number> {
    return this.prisma.user.count({
      where: { companyId, status: ResourceStatus.ACTIVE, active: true },
    })
  }

  async findCompanyUsers(
    companyId: string,
    pageable: Pageable,
    roles: UserRole[],
  ): Promise<Page<User>> {
    const where = {
      companyId,
      status: ResourceStatus.ACTIVE,
      active: true,
      role: { in: roles },
    }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.user.count({ where }),
    ])
    return Page.of(data, total, pageable)
  }

  async findCompanyUserById(companyId: string, id: string): Promise<UserWithDetalle | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE, active: true },
      include: { detalleCliente: { select: detalleSelect } },
    })
    return user as UserWithDetalle | null
  }

  async createCompanyUser(
    input: CreateUserInput,
    detalle?: CreateDetalleClienteInput,
  ): Promise<UserWithDetalle> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          companyId: input.companyId ?? null,
          role: input.role ?? UserRole.AGENT,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          passwordHash: input.passwordHash,
        },
      })

      if (detalle) {
        await tx.detalleCliente.create({
          data: { userId: user.id, ...detalle },
        })
      }

      const withDetalle = await tx.user.findFirst({
        where: { id: user.id },
        include: { detalleCliente: { select: detalleSelect } },
      })
      return withDetalle as UserWithDetalle
    })
  }

  async updateCompanyUserWithDetalle(
    id: string,
    input: UpdateUserInput,
    detalle?: UpdateDetalleClienteInput,
  ): Promise<UserWithDetalle> {
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: input })

      if (detalle !== undefined) {
        await tx.detalleCliente.upsert({
          where: { userId: id },
          create: { userId: id, ...detalle },
          update: detalle,
        })
      }

      const user = await tx.user.findFirst({
        where: { id },
        include: { detalleCliente: { select: detalleSelect } },
      })
      return user as UserWithDetalle
    })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { status: ResourceStatus.DELETED },
    })
  }

  async deactivateUser(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { active: false },
    })
  }
}
