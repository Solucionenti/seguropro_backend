import { Periodicidad, SuscripcionStatus } from '@gen/enums'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { ValidationError } from '@/shared/domain/validation-error'
import type { CompanyProvider } from '../domain/company-provider'
import type {
  CreateOwnerSuscripcionInput,
  CreateSuscripcionInput,
  SuscripcionWithDetails,
  UpdateSuscripcionInput,
} from '../domain/entities'
import type { PlanProvider } from '../domain/plan-provider'
import type { SuscripcionFilters, SuscripcionRepository } from '../domain/repository'
import type { ISuscripcionService } from '../domain/service'

const ACTIVE_STATUSES: SuscripcionStatus[] = [SuscripcionStatus.TRIAL, SuscripcionStatus.ACTIVA]

function addPeriod(date: Date, periodicidad: Periodicidad): Date {
  const d = new Date(date)
  switch (periodicidad) {
    case Periodicidad.MENSUAL:
      d.setMonth(d.getMonth() + 1)
      break
    case Periodicidad.TRIMESTRAL:
      d.setMonth(d.getMonth() + 3)
      break
    case Periodicidad.SEMESTRAL:
      d.setMonth(d.getMonth() + 6)
      break
    case Periodicidad.ANUAL:
      d.setFullYear(d.getFullYear() + 1)
      break
  }
  return d
}

export class SuscripcionService implements ISuscripcionService {
  constructor(
    private readonly repo: SuscripcionRepository,
    private readonly companyProvider: CompanyProvider,
    private readonly planProvider: PlanProvider,
  ) {}

  async list(
    page: number,
    pageSize: number,
    filters: SuscripcionFilters,
  ): Promise<{ data: SuscripcionWithDetails[]; total: number }> {
    return this.repo.findAll(page, pageSize, filters)
  }

  async create(input: CreateSuscripcionInput): Promise<SuscripcionWithDetails> {
    const company = await this.companyProvider.findActiveById(input.companyId)
    if (!company) {
      throw new ValidationError(`Company with id "${input.companyId}" not found or inactive`)
    }

    const plan = await this.planProvider.findActiveById(input.planId)
    if (!plan) {
      throw new ValidationError(`Plan with id "${input.planId}" not found or inactive`)
    }

    const isActive = input.active ?? true
    if (isActive && !ACTIVE_STATUSES.includes(input.suscripcionStatus)) {
      throw new ValidationError('An active subscription must have status TRIAL or ACTIVA')
    }

    return this.repo.create({ ...input, active: isActive })
  }

  async getById(id: string): Promise<SuscripcionWithDetails> {
    const suscripcion = await this.repo.findById(id)
    if (!suscripcion) {
      throw new NotFoundError('Suscripcion', id)
    }
    return suscripcion
  }

  async getCompleteById(id: string): Promise<SuscripcionWithDetails> {
    const suscripcion = await this.repo.findCompleteById(id)
    if (!suscripcion) {
      throw new NotFoundError('Suscripcion', id)
    }
    return suscripcion
  }

  async update(id: string, input: UpdateSuscripcionInput): Promise<SuscripcionWithDetails> {
    const existing = await this.getById(id)

    if (input.active === true) {
      const resolvedStatus = input.suscripcionStatus ?? existing.suscripcionStatus
      if (!ACTIVE_STATUSES.includes(resolvedStatus)) {
        throw new ValidationError('An active subscription must have status TRIAL or ACTIVA')
      }
    }

    return this.repo.update(id, input)
  }

  async deactivate(id: string): Promise<void> {
    await this.getById(id)
    return this.repo.deactivate(id)
  }

  async getMySubscription(companyId: string): Promise<SuscripcionWithDetails | null> {
    return this.repo.findActiveByCompanyWithDetails(companyId)
  }

  async createMySubscription(
    companyId: string,
    input: CreateOwnerSuscripcionInput,
  ): Promise<SuscripcionWithDetails> {
    const existing = await this.repo.findActiveByCompany(companyId)
    if (existing) {
      throw new ValidationError('Company already has an active subscription')
    }

    const plan = await this.planProvider.findActiveById(input.planId)
    if (!plan) {
      throw new ValidationError(`Plan with id "${input.planId}" not found or inactive`)
    }

    const fechaInicio = new Date()
    const fechaProximoPago = addPeriod(fechaInicio, plan.periodicidad)
    const suscripcionStatus = input.suscripcionStatus ?? SuscripcionStatus.ACTIVA

    return this.repo.create({
      companyId,
      planId: input.planId,
      suscripcionStatus,
      active: true,
      fechaInicio,
      fechaProximoPago,
      renovacionAutomatica: input.renovacionAutomatica ?? true,
    })
  }

  async cancelMySubscription(companyId: string): Promise<void> {
    const suscripcion = await this.repo.findActiveByCompany(companyId)
    if (!suscripcion) {
      throw new NotFoundError('active subscription', companyId)
    }
    await this.repo.update(suscripcion.id, {
      suscripcionStatus: SuscripcionStatus.CANCELADA,
      active: false,
      fechaFin: new Date(),
      renovacionAutomatica: false,
    })
  }

  async createMySubscriptionWithOrder(
    companyId: string,
    input: CreateOwnerSuscripcionInput,
  ): Promise<SuscripcionWithDetails> {
    const existing = await this.repo.findActiveByCompany(companyId)
    if (existing) {
      throw new ValidationError('Company already has an active subscription')
    }

    const plan = await this.planProvider.findActiveById(input.planId)
    if (!plan) {
      throw new ValidationError(`Plan with id "${input.planId}" not found or inactive`)
    }

    const fechaInicio = new Date()
    const fechaProximoPago = addPeriod(fechaInicio, plan.periodicidad)
    const suscripcionStatus = input.suscripcionStatus ?? SuscripcionStatus.ACTIVA

    return this.repo.createSuscipcionWithOrden({
      companyId,
      planId: input.planId,
      suscripcionStatus,
      active: true,
      fechaInicio,
      fechaProximoPago,
      renovacionAutomatica: input.renovacionAutomatica ?? true,
    })
  }
}
