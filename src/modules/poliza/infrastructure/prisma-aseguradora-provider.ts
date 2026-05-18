import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { AseguradoraProvider } from '../domain/aseguradora-provider'
import type { AseguradoraBasicInfo } from '../domain/entities'

export class PrismaAseguradoraProvider implements AseguradoraProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActiveByIdForCompany(
    id: string,
    companyId: string,
  ): Promise<AseguradoraBasicInfo | null> {
    return this.prisma.aseguradora.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE, active: true },
      select: { id: true, companyId: true, nombre: true },
    })
  }
}
