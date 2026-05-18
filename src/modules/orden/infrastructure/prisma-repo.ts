import { OrdenStatus, ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type {
  CreateOrdenInput,
  Orden,
  OrdenWithDetails,
  UpdateOrdenInput,
} from '../domain/entities'
import type { OrdenFilters, OrdenRepository } from '../domain/repository'

const companySelect = {
  id: true,
  nombreComercial: true,
  razonSocial: true,
} as const

const suscripcionSelect = {
  id: true,
  companyId: true,
  company: { select: companySelect },
} as const

export class PrismaOrdenRepository implements OrdenRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(pageable: Pageable, filters: OrdenFilters = {}): Promise<Page<OrdenWithDetails>> {
    const where = {
      status: ResourceStatus.ACTIVE,
      ...(filters.ordenStatus && { ordenStatus: filters.ordenStatus }),
      ...(filters.companyId && { suscripcion: { companyId: filters.companyId } }),
      ...(filters.cicloInicio && { cicloInicio: { gte: filters.cicloInicio } }),
      ...(filters.cicloFin && { cicloFin: { lte: filters.cicloFin } }),
      ...(filters.active !== undefined && { active: filters.active }),
    }
    const [data, total] = await Promise.all([
      this.prisma.orden.findMany({
        where,
        include: { suscripcion: { select: suscripcionSelect } },
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.orden.count({ where }),
    ])
    return Page.of(data, total, pageable)
  }

  async findById(id: string): Promise<OrdenWithDetails | null> {
    const row = await this.prisma.orden.findFirst({
      where: { id, status: ResourceStatus.ACTIVE },
      include: {
        suscripcion: {
          include: {
            company: true,
            plan: true,
          },
        },
      },
    })
    return row
  }

  async findPagadaByPeriod(
    suscripcionId: string,
    cicloInicio: Date,
    cicloFin: Date,
  ): Promise<Orden | null> {
    return this.prisma.orden.findFirst({
      where: {
        suscripcionId,
        ordenStatus: OrdenStatus.PAGADA,
        cicloInicio,
        cicloFin,
        status: ResourceStatus.ACTIVE,
      },
    })
  }

  async create(input: CreateOrdenInput): Promise<OrdenWithDetails> {
    const created = await this.prisma.orden.create({
      data: {
        suscripcionId: input.suscripcionId,
        cicloInicio: input.cicloInicio,
        cicloFin: input.cicloFin,
        monto: input.monto,
        moneda: input.moneda,
        ordenStatus: input.ordenStatus,
        proveedor: input.proveedor ?? null,
        proveedorOrdenId: input.proveedorOrdenId ?? null,
        proveedorPagoId: input.proveedorPagoId ?? null,
        ...(input.ordenStatus === OrdenStatus.PAGADA && { pagadaEn: new Date() }),
      },
      include: { suscripcion: { select: suscripcionSelect } },
    })
    return created
  }

  async update(id: string, input: UpdateOrdenInput): Promise<OrdenWithDetails> {
    const data = {
      ...input,
      ...(input.ordenStatus === OrdenStatus.PAGADA && !input.pagadaEn && { pagadaEn: new Date() }),
    }
    const updated = await this.prisma.orden.update({
      where: { id },
      data,
      include: { suscripcion: { select: suscripcionSelect } },
    })
    return updated
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.orden.update({
      where: { id },
      data: { active: false },
    })
  }
}
