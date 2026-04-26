import { OrdenStatus } from '@gen/enums'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { ValidationError } from '@/shared/domain/validation-error'
import type { CreateOrdenInput, OrdenWithDetails, UpdateOrdenInput } from '../domain/entities'
import type { OrdenFilters, OrdenRepository } from '../domain/repository'
import type { IOrdenService } from '../domain/service'
import type { SuscripcionProvider } from '../domain/suscripcion-provider'

export class OrdenService implements IOrdenService {
  constructor(
    private readonly repo: OrdenRepository,
    private readonly suscripcionProvider: SuscripcionProvider,
  ) {}

  async list(
    page: number,
    pageSize: number,
    filters: OrdenFilters,
  ): Promise<{ data: OrdenWithDetails[]; total: number }> {
    return this.repo.findAll(page, pageSize, filters)
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
}
