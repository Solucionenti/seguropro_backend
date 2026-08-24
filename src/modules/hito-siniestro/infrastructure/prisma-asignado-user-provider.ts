import { ResourceStatus, UserRole } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { AsignadoUserProvider } from '../domain/asignado-user-provider'
import type { AsignadoBasicInfo } from '../domain/entities'

export class PrismaAsignadoUserProvider implements AsignadoUserProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAssignableForCompany(
    userId: string,
    companyId: string,
  ): Promise<AsignadoBasicInfo | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
        role: { in: [UserRole.OWNER, UserRole.AGENT] },
        status: ResourceStatus.ACTIVE,
        active: true,
      },
      select: {
        id: true,
        companyId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    })
  }
}
