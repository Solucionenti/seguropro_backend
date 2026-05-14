import type { Periodicidad, SuscripcionStatus } from '@gen/enums'

export type ActiveSuscripcionInfo = {
  id: string
  companyId: string
  suscripcionStatus: SuscripcionStatus
  plan: { precio: number; periodicidad: Periodicidad }
}

export interface SuscripcionProvider {
  findById(id: string): Promise<{ id: string; companyId: string } | null>
  findActiveByCompany(companyId: string): Promise<ActiveSuscripcionInfo | null>
  updateFechaProximoPago(id: string, fecha: Date): Promise<void>
  updateFirstFechaProximoPago(id: string, fecha: Date): Promise<void>
}
