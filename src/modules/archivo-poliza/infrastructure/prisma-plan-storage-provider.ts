import { ResourceStatus, SuscripcionStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { PlanStorageProvider } from '../domain/plan-storage-provider'

export class PrismaPlanStorageProvider implements PlanStorageProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  // null means the active plan sets no storage cap
  async findLimitGBForCompany(companyId: string): Promise<number | null> {
    const suscripcion = await this.prisma.suscripcion.findFirst({
      where: {
        companyId,
        active: true,
        status: ResourceStatus.ACTIVE,
        suscripcionStatus: { in: [SuscripcionStatus.TRIAL, SuscripcionStatus.ACTIVA] },
      },
      select: { plan: { select: { limiteAlmacenamientoGB: true } } },
    })

    return suscripcion?.plan.limiteAlmacenamientoGB ?? null
  }
}
