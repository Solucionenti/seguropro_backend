import { ResourceStatus, SuscripcionStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { StorageQuota } from '@/shared/domain/storage-quota'
import { ValidationError } from '@/shared/domain/validation-error'

const BYTES_PER_GB = 1024 ** 3

export class PrismaStorageQuota implements StorageQuota {
  constructor(private readonly prisma: AppPrismaClient) {}

  async assertCanStore(companyId: string, incomingBytes: number): Promise<void> {
    const limitGB = await this.findLimitGB(companyId)
    if (limitGB === null) return

    const usedBytes = await this.sumUsedBytes(companyId)
    if (usedBytes + incomingBytes > limitGB * BYTES_PER_GB) {
      throw new ValidationError(`storage limit of ${limitGB} GB exceeded for this company`)
    }
  }

  // null means the active plan sets no storage cap
  private async findLimitGB(companyId: string): Promise<number | null> {
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

  private async sumUsedBytes(companyId: string): Promise<number> {
    const active = { status: ResourceStatus.ACTIVE, active: true }

    const [polizas, siniestros] = await Promise.all([
      this.prisma.archivoPoliza.aggregate({
        where: { ...active, poliza: { companyId } },
        _sum: { tamanoBytes: true },
      }),
      this.prisma.archivoSiniestro.aggregate({
        where: { ...active, siniestro: { companyId } },
        _sum: { tamanoBytes: true },
      }),
    ])

    return (polizas._sum.tamanoBytes ?? 0) + (siniestros._sum.tamanoBytes ?? 0)
  }
}
