import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { SuscripcionPlanProvider } from '../domain/suscripcion-plan-provider'

export class PrismaSuscripcionPlanProvider implements SuscripcionPlanProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActivePlanByCompany(companyId: string) {
    const result = await this.prisma.suscripcion.findFirst({
      where: { companyId, active: true, status: ResourceStatus.ACTIVE },
      select: {
        suscripcionStatus: true,
        plan: { select: { limiteUsuarios: true } },
      },
    })
    if (!result) return null
    return {
      suscripcionStatus: result.suscripcionStatus,
      limiteUsuarios: result.plan.limiteUsuarios,
    }
  }
}
