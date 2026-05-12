import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { CreatePlanInput, Plan, UpdatePlanInput } from '../domain/entities'
import type { PlanRepository } from '../domain/repository'

export class PrismaPlanRepository implements PlanRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(
    page: number,
    pageSize: number,
    active?: boolean,
  ): Promise<{ data: Plan[]; total: number }> {
    const where = {
      status: ResourceStatus.ACTIVE,
      ...(active !== undefined && { active }),
    }
    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plan.count({ where }),
    ])
    return { data, total }
  }

  async findById(id: string): Promise<Plan | null> {
    return this.prisma.plan.findFirst({
      where: { id, status: ResourceStatus.ACTIVE },
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
