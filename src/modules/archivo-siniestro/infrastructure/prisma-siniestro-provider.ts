import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { SiniestroBasicInfo } from '../domain/entities'
import type { SiniestroProvider } from '../domain/siniestro-provider'

export class PrismaSiniestroProvider implements SiniestroProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActiveByIdForCompany(
    id: string,
    companyId: string,
  ): Promise<SiniestroBasicInfo | null> {
    return this.prisma.siniestro.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE, active: true },
      select: { id: true, companyId: true, clienteUserId: true },
    })
  }
}
