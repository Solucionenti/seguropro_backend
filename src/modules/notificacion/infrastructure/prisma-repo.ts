import { NotificacionTipo } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { NotificacionRepository } from '../domain/repository'

export class PrismaNotificacionRepository implements NotificacionRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async registrarSiEsNueva(
    tipo: 'POLIZA_POR_VENCER',
    entidadId: string,
    marca: string,
  ): Promise<boolean> {
    // createMany + skipDuplicates lets the unique index answer the question in one
    // round trip, with no read-then-write race between concurrent job runs
    const { count } = await this.prisma.notificacionEnviada.createMany({
      data: [{ tipo: NotificacionTipo[tipo], entidadId, marca }],
      skipDuplicates: true,
    })

    return count === 1
  }
}
