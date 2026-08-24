import { HitoStatus, ResourceStatus, SuscripcionStatus, UserRole } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type {
  HitoAlertaProvider,
  HitoParaNotificar,
  SeveridadHito,
} from '../domain/hito-alerta-provider'

const MS_POR_DIA = 24 * 60 * 60 * 1000

function aMedianocheUtc(fecha: Date): number {
  return Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate())
}

export class PrismaHitoAlertaProvider implements HitoAlertaProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findParaNotificar(hoy: Date, diasAviso: number[]): Promise<HitoParaNotificar[]> {
    const inicioHoy = aMedianocheUtc(hoy)
    const horizonte = Math.max(0, ...diasAviso)

    const candidatos = await this.prisma.hitoSiniestro.findMany({
      where: {
        status: ResourceStatus.ACTIVE,
        active: true,
        alerta: true,
        hitoStatus: { in: [HitoStatus.PENDIENTE, HitoStatus.EN_PROCESO] },
        fechaLimite: { lte: new Date(inicioHoy + horizonte * MS_POR_DIA + MS_POR_DIA - 1) },
        siniestro: {
          status: ResourceStatus.ACTIVE,
          active: true,
          company: {
            status: ResourceStatus.ACTIVE,
            suscripciones: {
              some: {
                active: true,
                status: ResourceStatus.ACTIVE,
                suscripcionStatus: { in: [SuscripcionStatus.TRIAL, SuscripcionStatus.ACTIVA] },
              },
            },
          },
        },
      },
      select: {
        id: true,
        siniestroId: true,
        tarea: true,
        fechaLimite: true,
        asignadoA: { select: { email: true, firstName: true } },
        siniestro: {
          select: {
            poliza: { select: { numeroPoliza: true } },
            cliente: { select: { firstName: true, lastName: true } },
            company: {
              select: {
                users: {
                  where: { role: UserRole.OWNER, status: ResourceStatus.ACTIVE, active: true },
                  select: { email: true, firstName: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    })

    const resultado: HitoParaNotificar[] = []

    for (const hito of candidatos) {
      const diasRestantes = Math.round((aMedianocheUtc(hito.fechaLimite) - inicioHoy) / MS_POR_DIA)

      const marcaYSeveridad = resolverMarca(diasRestantes, diasAviso)
      // overdue and today always fire, upcoming only on a configured day
      if (!marcaYSeveridad) continue

      const owner = hito.siniestro.company.users[0]
      const destinatarios = [hito.asignadoA, owner]
        .filter((u): u is { email: string; firstName: string } => u !== null && u !== undefined)
        .filter((u, i, todos) => todos.findIndex((o) => o.email === u.email) === i)

      if (destinatarios.length === 0) continue

      resultado.push({
        id: hito.id,
        siniestroId: hito.siniestroId,
        tarea: hito.tarea,
        fechaLimite: hito.fechaLimite,
        severidad: marcaYSeveridad.severidad,
        diasRestantes,
        numeroPoliza: hito.siniestro.poliza.numeroPoliza,
        clienteNombre: `${hito.siniestro.cliente.firstName} ${hito.siniestro.cliente.lastName}`,
        destinatarios,
        marca: marcaYSeveridad.marca,
      })
    }

    return resultado
  }
}

// one marca per milestone reached, so a hito never repeats the same warning
function resolverMarca(
  diasRestantes: number,
  diasAviso: number[],
): { marca: string; severidad: SeveridadHito } | null {
  if (diasRestantes < 0) return { marca: 'VENCIDO', severidad: 'VENCIDO' }
  if (diasRestantes === 0) return { marca: 'HOY', severidad: 'HOY' }
  if (diasAviso.includes(diasRestantes)) {
    return { marca: `PROXIMO-${diasRestantes}`, severidad: 'PROXIMO' }
  }
  return null
}
