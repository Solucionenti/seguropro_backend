import { ResourceStatus, UserRole } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { ClienteUserProvider } from '../domain/cliente-user-provider'
import type { ClienteBasicInfo } from '../domain/entities'

export class PrismaClienteUserProvider implements ClienteUserProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActiveClientForCompany(
    userId: string,
    companyId: string,
  ): Promise<ClienteBasicInfo | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
        role: UserRole.CLIENT,
        status: ResourceStatus.ACTIVE,
      },
      select: { id: true, companyId: true, firstName: true, lastName: true, email: true },
    })
  }
}
