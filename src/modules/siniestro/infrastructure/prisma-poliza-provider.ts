import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { PolizaBasicInfo } from '../domain/entities'
import type { PolizaProvider } from '../domain/poliza-provider'

export class PrismaPolizaProvider implements PolizaProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActiveByIdForCompany(id: string, companyId: string): Promise<PolizaBasicInfo | null> {
    return this.prisma.poliza.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE, active: true },
      select: {
        id: true,
        companyId: true,
        clienteUserId: true,
        numeroPoliza: true,
        fechaInicio: true,
        fechaVencimiento: true,
      },
    })
  }
}
