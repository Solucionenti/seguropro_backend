import { OrdenStatus, SuscripcionStatus } from '@gen/enums'
import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type {
  CreateOrdenInput,
  CreateOwnerOrdenInput,
  OrdenWithDetails,
  PayOrdenInput,
  UpdateOrdenInput,
} from '../domain/entities'
import type { OrdenFilters, OrdenRepository } from '../domain/repository'
import type { IOrdenService, OwnerOrdenFilters } from '../domain/service'
import type { SuscripcionProvider } from '../domain/suscripcion-provider'

const ACTIVE_SUSCRIPCION_STATUSES: SuscripcionStatus[] = [
  SuscripcionStatus.TRIAL,
  SuscripcionStatus.ACTIVA,
]

export class OrdenService implements IOrdenService {
  constructor(
    private readonly repo: OrdenRepository,
    private readonly suscripcionProvider: SuscripcionProvider,
  ) {}

  async list(pageable: Pageable, filters?: OrdenFilters): Promise<Page<OrdenWithDetails>> {
    return this.repo.findAll(pageable, filters)
  }

  async create(input: CreateOrdenInput): Promise<OrdenWithDetails> {
    const suscripcion = await this.suscripcionProvider.findById(input.suscripcionId)
    if (!suscripcion) {
      throw new ValidationError(`Suscripcion with id "${input.suscripcionId}" not found`)
    }

    if (input.ordenStatus === OrdenStatus.PAGADA) {
      const duplicate = await this.repo.findPagadaByPeriod(
        input.suscripcionId,
        input.cicloInicio,
        input.cicloFin,
      )
      if (duplicate) {
        throw new ValidationError('A PAGADA order already exists for this subscription and period')
      }
    }

    const orden = await this.repo.create(input)

    if (input.ordenStatus === OrdenStatus.PAGADA) {
      await this.suscripcionProvider.updateFechaProximoPago(input.suscripcionId, input.cicloFin)
    }

    return orden
  }

  async getById(id: string): Promise<OrdenWithDetails> {
    const orden = await this.repo.findById(id)
    if (!orden) {
      throw new NotFoundError('Orden', id)
    }
    return orden
  }

  async update(id: string, input: UpdateOrdenInput): Promise<OrdenWithDetails> {
    const existing = await this.getById(id)

    if (existing.ordenStatus === OrdenStatus.PAGADA) {
      throw new ValidationError('A PAGADA order cannot be modified')
    }

    const orden = await this.repo.update(id, input)

    if (input.ordenStatus === OrdenStatus.PAGADA) {
      await this.suscripcionProvider.updateFechaProximoPago(
        existing.suscripcionId,
        existing.cicloFin,
      )
    }

    return orden
  }

  async deactivate(id: string): Promise<void> {
    await this.getById(id)
    return this.repo.deactivate(id)
  }

  async listMyOrdenes(
    companyId: string,
    pageable: Pageable,
    filters: OwnerOrdenFilters = {},
  ): Promise<Page<OrdenWithDetails>> {
    return this.repo.findAll(pageable, { ...filters, companyId, active: true })
  }

  async createMyOrden(companyId: string, input: CreateOwnerOrdenInput): Promise<OrdenWithDetails> {
    const suscripcion = await this.suscripcionProvider.findActiveByCompany(companyId)
    if (!suscripcion) {
      throw new ValidationError('No active subscription found for this company')
    }

    if (!ACTIVE_SUSCRIPCION_STATUSES.includes(suscripcion.suscripcionStatus)) {
      throw new ValidationError('Subscription must have status TRIAL or ACTIVA to create an order')
    }

    const duplicate = await this.repo.findPagadaByPeriod(
      suscripcion.id,
      input.cicloInicio,
      input.cicloFin,
    )
    if (duplicate) {
      throw new ValidationError('A PAGADA order already exists for this subscription and period')
    }

    return this.repo.create({
      suscripcionId: suscripcion.id,
      cicloInicio: input.cicloInicio,
      cicloFin: input.cicloFin,
      monto: suscripcion.plan.precio,
      moneda: input.moneda ?? 'MXN',
      ordenStatus: OrdenStatus.PENDIENTE,
    })
  }

  async getMyOrdenById(companyId: string, id: string): Promise<OrdenWithDetails> {
    const orden = await this.getById(id)
    if (orden.suscripcion.companyId !== companyId) {
      throw new NotFoundError('Orden', id)
    }
    return orden
  }

  async payMyOrden(companyId: string, id: string, input: PayOrdenInput): Promise<OrdenWithDetails> {
    const orden = await this.getMyOrdenById(companyId, id)

    if (orden.ordenStatus !== OrdenStatus.PENDIENTE) {
      throw new ValidationError('Only PENDIENTE orders can be paid')
    }

    const duplicate = await this.repo.findPagadaByPeriod(
      orden.suscripcionId,
      orden.cicloInicio,
      orden.cicloFin,
    )
    if (duplicate) {
      throw new ValidationError('A PAGADA order already exists for this period')
    }

    const updated = await this.repo.update(id, {
      ordenStatus: OrdenStatus.PAGADA,
      pagadaEn: input.pagadaEn ?? new Date(),
      proveedor: input.proveedor,
      proveedorOrdenId: input.proveedorOrdenId,
      proveedorPagoId: input.proveedorPagoId,
    })

    await this.suscripcionProvider.updateFechaProximoPago(orden.suscripcionId, orden.cicloFin)

    return updated
  }

  async payMyFirstOrden(
    companyId: string,
    id: string,
    input: PayOrdenInput,
  ): Promise<OrdenWithDetails> {
    const orden = await this.getMyOrdenById(companyId, id)

    if (orden.ordenStatus !== OrdenStatus.PENDIENTE) {
      throw new ValidationError('Only PENDIENTE orders can be paid')
    }

    const duplicate = await this.repo.findPagadaByPeriod(
      orden.suscripcionId,
      orden.cicloInicio,
      orden.cicloFin,
    )
    if (duplicate) {
      throw new ValidationError('A PAGADA order already exists for this period')
    }

    const updated = await this.repo.update(id, {
      ordenStatus: OrdenStatus.PAGADA,
      pagadaEn: input.pagadaEn ?? new Date(),
      proveedor: input.proveedor,
      proveedorOrdenId: input.proveedorOrdenId,
      proveedorPagoId: input.proveedorPagoId,
    })

    await this.suscripcionProvider.updateFirstFechaProximoPago(orden.suscripcionId, orden.cicloFin)

    return updated
  }
}
