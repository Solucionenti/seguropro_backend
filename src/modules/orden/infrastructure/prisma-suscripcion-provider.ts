import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { SuscripcionProvider } from '../domain/suscripcion-provider'

export class PrismaSuscripcionProvider implements SuscripcionProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findById(id: string): Promise<{ id: string; companyId: string } | null> {
    return this.prisma.suscripcion.findFirst({
      where: { id, status: ResourceStatus.ACTIVE },
      select: { id: true, companyId: true },
    })
  }

  async updateFechaProximoPago(id: string, fecha: Date): Promise<void> {
    await this.prisma.suscripcion.update({
      where: { id },
      data: { fechaProximoPago: fecha },
    })
  }
}
