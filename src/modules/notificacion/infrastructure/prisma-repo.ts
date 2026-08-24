import { NotificacionTipo } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { NotificacionRepository } from '../domain/repository'

export class PrismaNotificacionRepository implements NotificacionRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async registrarSiEsNueva(
    tipo: 'POLIZA_POR_VENCER' | 'HITO_ALERTA',
    entidadId: string,
    marca: string,
  ): Promise<boolean> {
    // the unique index answers in one round trip, with no read-then-write race
    const { count } = await this.prisma.notificacionEnviada.createMany({
      data: [{ tipo: NotificacionTipo[tipo], entidadId, marca }],
      skipDuplicates: true,
    })

    return count === 1
  }
}
