import { HitoStatus } from '@gen/enums'
import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { AlertaRepository, HitoAlerta } from '../domain/alertas'
import type { AsignadoUserProvider } from '../domain/asignado-user-provider'
import type { HitoSiniestroWithDetails } from '../domain/entities'
import type { HitoRepository } from '../domain/repository'
import type {
  CreateHitoServiceInput,
  HitoScope,
  IHitoService,
  ListAlertasFilters,
  ListHitosFilters,
  UpdateHitoServiceInput,
} from '../domain/service'
import type { SiniestroProvider } from '../domain/siniestro-provider'

const MS_POR_DIA = 24 * 60 * 60 * 1000

export class HitoService implements IHitoService {
  constructor(
    private readonly repo: HitoRepository,
    private readonly alertaRepo: AlertaRepository,
    private readonly siniestroProvider: SiniestroProvider,
    private readonly asignadoProvider: AsignadoUserProvider,
  ) {}

  async list(
    scope: HitoScope,
    pageable: Pageable,
    filters: ListHitosFilters,
  ): Promise<Page<HitoSiniestroWithDetails>> {
    await this.assertSiniestroAccessible(scope)
    return this.repo.findAllBySiniestro(pageable, { siniestroId: scope.siniestroId, ...filters })
  }

  async create(scope: HitoScope, input: CreateHitoServiceInput): Promise<HitoSiniestroWithDetails> {
    await this.assertSiniestroAccessible(scope)

    if (input.fechaLimite.getTime() < Date.now()) {
      throw new ValidationError('fechaLimite cannot be in the past')
    }

    if (input.asignadoAUserId) {
      await this.assertAsignable(input.asignadoAUserId, scope.companyId)
    }

    return this.repo.create({
      siniestroId: scope.siniestroId,
      tarea: input.tarea,
      fechaLimite: input.fechaLimite,
      descripcion: input.descripcion ?? null,
      alerta: input.alerta,
      hitoStatus: input.hitoStatus,
      asignadoAUserId: input.asignadoAUserId ?? null,
    })
  }

  async getById(id: string, scope: HitoScope): Promise<HitoSiniestroWithDetails> {
    await this.assertSiniestroAccessible(scope)

    const hito = await this.repo.findByIdForSiniestro(id, scope.siniestroId)
    if (!hito) {
      throw new NotFoundError('HitoSiniestro', id)
    }
    return hito
  }

  async update(
    id: string,
    scope: HitoScope,
    input: UpdateHitoServiceInput,
  ): Promise<HitoSiniestroWithDetails> {
    await this.getById(id, scope)

    if (input.asignadoAUserId) {
      await this.assertAsignable(input.asignadoAUserId, scope.companyId)
    }

    return this.repo.update(id, input)
  }

  async softDelete(id: string, scope: HitoScope): Promise<void> {
    await this.getById(id, scope)
    return this.repo.softDelete(id)
  }

  // severity is derived on read, never stored
  async listAlertas(pageable: Pageable, filters: ListAlertasFilters): Promise<Page<HitoAlerta>> {
    const hasta = new Date(Date.now() + filters.diasHorizonte * MS_POR_DIA)

    return this.alertaRepo.findAlertas(pageable, {
      companyId: filters.companyId,
      hasta,
      severidad: filters.severidad,
      asignadoAUserId: filters.asignadoAUserId,
      siniestroId: filters.siniestroId,
    })
  }

  private async assertAsignable(userId: string, companyId: string): Promise<void> {
    const asignado = await this.asignadoProvider.findAssignableForCompany(userId, companyId)
    if (!asignado) {
      throw new ValidationError(
        'asignadoAUserId must be an active OWNER or AGENT of the same company',
      )
    }
  }

  // notFound instead of forbidden so a foreign siniestro looks the same as a missing one
  private async assertSiniestroAccessible(scope: HitoScope): Promise<void> {
    const siniestro = await this.siniestroProvider.findActiveByIdForCompany(
      scope.siniestroId,
      scope.companyId,
    )

    if (!siniestro) {
      throw new NotFoundError('Siniestro', scope.siniestroId)
    }
    if (scope.clienteUserId && siniestro.clienteUserId !== scope.clienteUserId) {
      throw new NotFoundError('Siniestro', scope.siniestroId)
    }
  }
}

export function calcularSeveridad(
  fechaLimite: Date,
  hoy: Date,
): {
  severidad: 'VENCIDO' | 'HOY' | 'PROXIMO'
  diasRestantes: number
} {
  const inicioHoy = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate())
  const inicioLimite = Date.UTC(
    fechaLimite.getUTCFullYear(),
    fechaLimite.getUTCMonth(),
    fechaLimite.getUTCDate(),
  )
  const diasRestantes = Math.round((inicioLimite - inicioHoy) / MS_POR_DIA)

  if (diasRestantes < 0) return { severidad: 'VENCIDO', diasRestantes }
  if (diasRestantes === 0) return { severidad: 'HOY', diasRestantes }
  return { severidad: 'PROXIMO', diasRestantes }
}

export function estaAbierto(hitoStatus: HitoStatus): boolean {
  return hitoStatus === HitoStatus.PENDIENTE || hitoStatus === HitoStatus.EN_PROCESO
}
