import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { CompanyProvider } from '../domain/company-provider'
import type { CompanyBasicInfo } from '../domain/entities'

export class PrismaCompanyProvider implements CompanyProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActiveById(id: string): Promise<CompanyBasicInfo | null> {
    return this.prisma.company.findFirst({
      where: { id, status: ResourceStatus.ACTIVE },
      select: { id: true, nombreComercial: true, razonSocial: true },
    })
  }
}
