import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type { CreatePlanInput, Plan, UpdatePlanInput } from '../domain/entities'
import type { PlanFilters, PlanRepository } from '../domain/repository'

const completePlan = {
  suscripciones: true,
} as const

export class PrismaPlanRepository implements PlanRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(pageable: Pageable, filters: PlanFilters = {}): Promise<Page<Plan>> {
    const where = {
      status: ResourceStatus.ACTIVE,
      ...(filters.active !== undefined && { active: filters.active }),
    }
    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.plan.count({ where }),
    ])
    return Page.of(data, total, pageable)
  }

  async findById(id: string): Promise<Plan | null> {
    return this.prisma.plan.findFirst({
      where: { id, status: ResourceStatus.ACTIVE },
    })
  }

  async findCompleteById(id: string): Promise<Plan | null> {
    return this.prisma.plan.findFirst({
      where: { id, status: ResourceStatus.ACTIVE },
      include: completePlan,
    })
  }

  async findByNombre(nombre: string): Promise<Plan | null> {
    return this.prisma.plan.findFirst({
      where: { nombre, status: ResourceStatus.ACTIVE },
    })
  }

  async create(input: CreatePlanInput): Promise<Plan> {
    return this.prisma.plan.create({
      data: {
        nombre: input.nombre,
        precio: input.precio,
        periodicidad: input.periodicidad,
        limiteUsuarios: input.limiteUsuarios,
        descripcion: input.descripcion ?? null,
        limiteAlmacenamientoGB: input.limiteAlmacenamientoGB ?? null,
        features: input.features ?? undefined,
        active: input.active ?? true,
      },
    })
  }

  async update(id: string, input: UpdatePlanInput): Promise<Plan> {
    return this.prisma.plan.update({
      where: { id },
      data: input,
    })
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.plan.update({
      where: { id },
      data: { active: false },
    })
  }
}
