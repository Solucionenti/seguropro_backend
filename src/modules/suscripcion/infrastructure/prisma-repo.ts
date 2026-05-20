import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type {
  CreateSuscripcionInput,
  Suscripcion,
  SuscripcionWithDetails,
  UpdateSuscripcionInput,
} from '../domain/entities'
import type { SuscripcionFilters, SuscripcionRepository } from '../domain/repository'

const companySelect = {
  id: true,
  nombreComercial: true,
  razonSocial: true,
} as const

const planSelect = {
  id: true,
  nombre: true,
  precio: true,
  periodicidad: true,
} as const

const includeDetails = {
  company: { select: companySelect },
  plan: { select: planSelect },
} as const

export class PrismaSuscripcionRepository implements SuscripcionRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(
    pageable: Pageable,
    filters: SuscripcionFilters = {},
  ): Promise<Page<SuscripcionWithDetails>> {
    const where = {
      status: ResourceStatus.ACTIVE,
      ...(filters.companyId && { companyId: filters.companyId }),
      ...(filters.suscripcionStatus && { suscripcionStatus: filters.suscripcionStatus }),
      ...(filters.active !== undefined && { active: filters.active }),
    }
    const [data, total] = await Promise.all([
      this.prisma.suscripcion.findMany({
        where,
        include: includeDetails,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.suscripcion.count({ where }),
    ])
    return Page.of(data, total, pageable)
  }

  async findById(id: string): Promise<SuscripcionWithDetails | null> {
    const row = await this.prisma.suscripcion.findFirst({
      where: { id, status: ResourceStatus.ACTIVE },
      include: includeDetails,
    })
    return row
  }

  async findCompleteById(id: string): Promise<SuscripcionWithDetails | null> {
    const row = await this.prisma.suscripcion.findFirst({
      where: { id, status: ResourceStatus.ACTIVE },
      include: {
        company: true,
        ordenes: true,
        plan: true,
      },
    })
    return row
  }

  async findActiveByCompany(companyId: string): Promise<Suscripcion | null> {
    return this.prisma.suscripcion.findFirst({
      where: { companyId, active: true, status: ResourceStatus.ACTIVE },
    })
  }

  async findActiveByCompanyWithDetails(companyId: string): Promise<SuscripcionWithDetails | null> {
    return this.prisma.suscripcion.findFirst({
      where: { companyId, active: true, status: ResourceStatus.ACTIVE },
      include: {
        company: true,
        plan: true,
        ordenes: true,
      },
    })
  }

  async create(input: CreateSuscripcionInput): Promise<SuscripcionWithDetails> {
    const isActive = input.active ?? true

    if (isActive) {
      return this.prisma.$transaction(async (tx) => {
        await tx.suscripcion.updateMany({
          where: { companyId: input.companyId, active: true, status: ResourceStatus.ACTIVE },
          data: { active: false },
        })
        const created = await tx.suscripcion.create({
          data: {
            companyId: input.companyId,
            planId: input.planId,
            suscripcionStatus: input.suscripcionStatus,
            active: true,
            fechaInicio: input.fechaInicio,
            fechaFin: input.fechaFin ?? null,
            fechaProximoPago: input.fechaProximoPago,
            renovacionAutomatica: input.renovacionAutomatica ?? true,
          },
          include: includeDetails,
        })
        return created
      })
    }

    const created = await this.prisma.suscripcion.create({
      data: {
        companyId: input.companyId,
        planId: input.planId,
        suscripcionStatus: input.suscripcionStatus,
        active: false,
        fechaInicio: input.fechaInicio,
        fechaFin: input.fechaFin ?? null,
        fechaProximoPago: input.fechaProximoPago,
        renovacionAutomatica: input.renovacionAutomatica ?? true,
      },
      include: includeDetails,
    })
    return created
  }

  async update(id: string, input: UpdateSuscripcionInput): Promise<SuscripcionWithDetails> {
    if (input.active === true) {
      const current = await this.prisma.suscripcion.findFirst({
        where: { id, status: ResourceStatus.ACTIVE },
        select: { companyId: true },
      })
      if (current) {
        return this.prisma.$transaction(async (tx) => {
          await tx.suscripcion.updateMany({
            where: {
              companyId: current.companyId,
              active: true,
              status: ResourceStatus.ACTIVE,
              id: { not: id },
            },
            data: { active: false },
          })
          const updated = await tx.suscripcion.update({
            where: { id },
            data: input,
            include: includeDetails,
          })
          return updated
        })
      }
    }

    const updated = await this.prisma.suscripcion.update({
      where: { id },
      data: input,
      include: includeDetails,
    })
    return updated
  }

  async deactivateByCompany(companyId: string, excludeId?: string): Promise<void> {
    await this.prisma.suscripcion.updateMany({
      where: {
        companyId,
        active: true,
        status: ResourceStatus.ACTIVE,
        ...(excludeId && { id: { not: excludeId } }),
      },
      data: { active: false },
    })
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.suscripcion.update({
      where: { id },
      data: { active: false },
    })
  }

  async createSuscipcionWithOrden(input: CreateSuscripcionInput): Promise<SuscripcionWithDetails> {
    const existingSuscripcion = await this.prisma.suscripcion.findFirst({
      where: { companyId: input.companyId, active: true, status: ResourceStatus.ACTIVE },
    })

    if (existingSuscripcion) {
      throw new Error('Company already has an active subscription')
    }

    const suscriptionCreated = await this.prisma.suscripcion.create({
      data: {
        companyId: input.companyId,
        planId: input.planId,
        suscripcionStatus: input.suscripcionStatus,
        active: false,
        fechaInicio: input.fechaInicio,
        fechaFin: input.fechaFin ?? null,
        fechaProximoPago: input.fechaProximoPago,
        renovacionAutomatica: input.renovacionAutomatica ?? true,
      },
      include: {
        plan: true,
        company: true,
      },
    })

    const ordenCreated = await this.prisma.orden.create({
      data: {
        cicloFin: input.fechaProximoPago,
        cicloInicio: input.fechaInicio,
        monto: suscriptionCreated.plan.precio,
        suscripcionId: suscriptionCreated.id,
      },
    })

    return {
      ...suscriptionCreated,
      ordenes: [ordenCreated],
    }
  }
}
