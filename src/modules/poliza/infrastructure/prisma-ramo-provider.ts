import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { RamoBasicInfo } from '../domain/entities'
import type { RamoProvider } from '../domain/ramo-provider'

export class PrismaRamoProvider implements RamoProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActiveByIdForCompany(id: string, companyId: string): Promise<RamoBasicInfo | null> {
    return this.prisma.ramo.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE, active: true },
      select: { id: true, companyId: true, nombre: true },
    })
  }
}
