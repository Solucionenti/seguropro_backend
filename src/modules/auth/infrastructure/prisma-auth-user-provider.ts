import { ResourceStatus, UserRole } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { AuthUser, AuthUserProvider, AuthUserWithCompany } from '../domain/auth-user-provider'

export class PrismaAuthUserProvider implements AuthUserProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findByEmailAndCompany(email: string, companyId: string): Promise<AuthUser | null> {
    return this.prisma.user.findFirst({
      where: { email, companyId, status: ResourceStatus.ACTIVE },
      omit: { passwordHash: false },
    })
  }

  async findMasterAdminByEmail(email: string): Promise<AuthUser | null> {
    return this.prisma.user.findFirst({
      where: { email, role: UserRole.MASTER_ADMIN, companyId: null, status: ResourceStatus.ACTIVE },
      omit: { passwordHash: false },
    })
  }

  async findMasterAdminOrOwnerByEmail(email: string): Promise<AuthUser | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        role: { in: [UserRole.MASTER_ADMIN, UserRole.OWNER] },
        status: ResourceStatus.ACTIVE,
      },
      omit: { passwordHash: false },
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

  async findActiveByEmail(email: string): Promise<AuthUserWithCompany[]> {
    const users = await this.prisma.user.findMany({
      where: { email, status: ResourceStatus.ACTIVE },
      omit: { passwordHash: false },
      include: { company: { select: { nombreComercial: true } } },
    })

    return users.map(({ company, ...user }) => ({
      ...user,
      companyName: company?.nombreComercial ?? null,
    }))
  }

  async findActiveById(userId: string): Promise<AuthUser | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, status: ResourceStatus.ACTIVE },
      omit: { passwordHash: false },
    })
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })
  }

  async updateLastLogin(userId: string, timestamp: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: timestamp },
    })
  }
}
