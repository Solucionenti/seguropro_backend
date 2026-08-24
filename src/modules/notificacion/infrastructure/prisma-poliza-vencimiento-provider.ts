import { PolizaStatus, ResourceStatus, SuscripcionStatus, UserRole } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { PolizaPorVencer } from '../domain/entities'
import type { PolizaVencimientoProvider } from '../domain/poliza-vencimiento-provider'

const MS_POR_DIA = 24 * 60 * 60 * 1000

function aMedianocheUtc(fecha: Date): number {
  return Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate())
}

export class PrismaPolizaVencimientoProvider implements PolizaVencimientoProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findPorVencer(hoy: Date): Promise<PolizaPorVencer[]> {
    const inicioHoy = aMedianocheUtc(hoy)

    // postgres cannot MAX an int[], so widen to the largest horizon and match in memory
    const empresas = await this.prisma.company.findMany({
      where: { status: ResourceStatus.ACTIVE },
      select: { avisoVencimientoDias: true },
    })
    const horizonte = Math.max(0, ...empresas.flatMap((e) => e.avisoVencimientoDias))
    if (horizonte === 0) return []

    const candidatas = await this.prisma.poliza.findMany({
      where: {
        status: ResourceStatus.ACTIVE,
        active: true,
        polizaStatus: { in: [PolizaStatus.VIGENTE, PolizaStatus.PROXIMA_A_VENCER] },
        fechaVencimiento: {
          gte: new Date(inicioHoy),
          lte: new Date(inicioHoy + horizonte * MS_POR_DIA),
        },
        // no notices without an active subscription
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
      select: {
        id: true,
        companyId: true,
        numeroPoliza: true,
        fechaVencimiento: true,
        aseguradora: { select: { nombre: true } },
        cliente: { select: { firstName: true, lastName: true } },
        company: {
          select: {
            avisoVencimientoDias: true,
            users: {
              where: { role: UserRole.OWNER, status: ResourceStatus.ACTIVE, active: true },
              select: { email: true, firstName: true },
              take: 1,
            },
          },
        },
      },
    })

    const resultado: PolizaPorVencer[] = []

    for (const poliza of candidatas) {
      const owner = poliza.company.users[0]
      // an orphaned company has nobody to notify
      if (!owner) continue
      // a quote has no numero nor dates yet
      if (!poliza.fechaVencimiento || !poliza.numeroPoliza) continue

      const diasRestantes = Math.round(
        (aMedianocheUtc(poliza.fechaVencimiento) - inicioHoy) / MS_POR_DIA,
      )
      // only fire on the exact configured day, so each threshold sends once
      if (!poliza.company.avisoVencimientoDias.includes(diasRestantes)) continue

      resultado.push({
        id: poliza.id,
        companyId: poliza.companyId,
        numeroPoliza: poliza.numeroPoliza,
        fechaVencimiento: poliza.fechaVencimiento,
        aseguradoraNombre: poliza.aseguradora.nombre,
        clienteNombre: `${poliza.cliente.firstName} ${poliza.cliente.lastName}`,
        ownerEmail: owner.email,
        ownerFirstName: owner.firstName,
        umbralDias: diasRestantes,
        diasRestantes,
      })
    }

    return resultado
  }

  async marcarProximaAVencer(polizaId: string): Promise<void> {
    await this.prisma.poliza.update({
      where: { id: polizaId },
      data: { polizaStatus: PolizaStatus.PROXIMA_A_VENCER },
    })
  }
}
