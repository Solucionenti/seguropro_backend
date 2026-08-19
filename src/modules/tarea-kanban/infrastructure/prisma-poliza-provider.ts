import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { TareaKanbanPolizaProvider } from '../domain/poliza-provider'

export class PrismaTareaKanbanPolizaProvider implements TareaKanbanPolizaProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActiveByIdForCompany(id: string, companyId: string): Promise<boolean> {
    const poliza = await this.prisma.poliza.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE, active: true },
      select: { id: true },
    })
    return poliza !== null
  }
}
