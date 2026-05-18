import type { SuscripcionStatus } from '@gen/enums'

export interface SuscripcionPlanProvider {
  findActivePlanByCompany(
    companyId: string,
  ): Promise<{ limiteUsuarios: number; suscripcionStatus: SuscripcionStatus } | null>
}
