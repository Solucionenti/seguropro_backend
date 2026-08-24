import type { Prisma } from '@gen/client'
import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import { calcularSeveridad } from '../application/service'
import type { AlertaFilters, AlertaRepository, HitoAlerta } from '../domain/alertas'
import { ESTADOS_ABIERTOS } from '../domain/alertas'

export class PrismaAlertaRepository implements AlertaRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAlertas(pageable: Pageable, filters: AlertaFilters): Promise<Page<HitoAlerta>> {
    const where: Prisma.HitoSiniestroWhereInput = {
      status: ResourceStatus.ACTIVE,
      active: true,
      hitoStatus: { in: ESTADOS_ABIERTOS },
      fechaLimite: { lte: filters.hasta },
      siniestro: {
        companyId: filters.companyId,
        status: ResourceStatus.ACTIVE,
        active: true,
      },
      ...(filters.asignadoAUserId && { asignadoAUserId: filters.asignadoAUserId }),
      ...(filters.siniestroId && { siniestroId: filters.siniestroId }),
    }

    // severity cannot be sorted in sql, but fechaLimite asc already puts overdue first
    const rows = await this.prisma.hitoSiniestro.findMany({
      where,
      orderBy: { fechaLimite: 'asc' },
      include: {
        asignadoA: { select: { firstName: true, lastName: true } },
        siniestro: {
          select: {
            poliza: { select: { numeroPoliza: true } },
            cliente: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    const hoy = new Date()
    const alertas: HitoAlerta[] = rows.map((hito) => {
      const { severidad, diasRestantes } = calcularSeveridad(hito.fechaLimite, hoy)

      return {
        id: hito.id,
        siniestroId: hito.siniestroId,
        tarea: hito.tarea,
        descripcion: hito.descripcion,
        fechaLimite: hito.fechaLimite,
        alerta: hito.alerta,
        hitoStatus: hito.hitoStatus,
        asignadoAUserId: hito.asignadoAUserId,
        active: hito.active,
        status: hito.status,
        createdAt: hito.createdAt,
        updatedAt: hito.updatedAt,
        severidad,
        diasRestantes,
        asignadoANombre: hito.asignadoA
          ? `${hito.asignadoA.firstName} ${hito.asignadoA.lastName}`
          : null,
        numeroPoliza: hito.siniestro.poliza.numeroPoliza,
        clienteNombre: `${hito.siniestro.cliente.firstName} ${hito.siniestro.cliente.lastName}`,
      }
    })

    const filtradas = filters.severidad
      ? alertas.filter((a) => a.severidad === filters.severidad)
      : alertas

    // paginated after filtering so total matches what the caller sees
    const content = filtradas.slice(pageable.skip, pageable.skip + pageable.take)
    return Page.of(content, filtradas.length, pageable)
  }
}
