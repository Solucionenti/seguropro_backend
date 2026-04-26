import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { PlanBasicInfo } from '../domain/entities'
import type { PlanProvider } from '../domain/plan-provider'

export class PrismaPlanProvider implements PlanProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActiveById(id: string): Promise<PlanBasicInfo | null> {
    return this.prisma.plan.findFirst({
      where: { id, status: ResourceStatus.ACTIVE, active: true },
      select: { id: true, nombre: true, precio: true, periodicidad: true },
    })
  }
}
