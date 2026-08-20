import type { Prisma } from '@gen/client'
import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type {
  ColumnaKanban,
  CreateColumnaKanbanInput,
  UpdateColumnaKanbanInput,
} from '../domain/entities'
import type { ColumnaKanbanFilters, ColumnaKanbanRepository } from '../domain/repository'

export class PrismaColumnaKanbanRepository implements ColumnaKanbanRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(pageable: Pageable, filters: ColumnaKanbanFilters): Promise<Page<ColumnaKanban>> {
    const where: Prisma.ColumnaKanbanWhereInput = {
      companyId: filters.companyId,
      status: ResourceStatus.ACTIVE,
      ...(filters.nombre && { nombre: { contains: filters.nombre, mode: 'insensitive' } }),
    }
    const [data, total] = await Promise.all([
      this.prisma.columnaKanban.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.columnaKanban.count({ where }),
    ])
    return Page.of(data, total, pageable)
  }

  async findById(id: string, companyId: string): Promise<ColumnaKanban | null> {
    return this.prisma.columnaKanban.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE },
    })
  }

  async findByPrioridadAndCompany(
    prioridad: number,
    companyId: string,
  ): Promise<ColumnaKanban | null> {
    return this.prisma.columnaKanban.findFirst({
      where: { prioridad, companyId, status: ResourceStatus.ACTIVE },
    })
  }

  async create(input: CreateColumnaKanbanInput): Promise<ColumnaKanban> {
    return this.prisma.columnaKanban.create({ data: input })
  }

  async update(id: string, input: UpdateColumnaKanbanInput): Promise<ColumnaKanban> {
    return this.prisma.columnaKanban.update({ where: { id }, data: input })
  }

  async updateWithPriorityReorder(
    id: string,
    companyId: string,
    currentPriority: number,
    newPriority: number,
    input: UpdateColumnaKanbanInput,
  ): Promise<ColumnaKanban> {
    return this.prisma.$transaction(async (tx) => {
      // Free the current unique-index value before shifting the other columns.
      await tx.columnaKanban.update({ where: { id }, data: { prioridad: 0 } })

      const columnsToShift = await tx.columnaKanban.findMany({
        where: {
          companyId,
          status: ResourceStatus.ACTIVE,
          prioridad:
            currentPriority < newPriority
              ? { gt: currentPriority, lte: newPriority }
              : { gte: newPriority, lt: currentPriority },
        },
        orderBy: { prioridad: currentPriority < newPriority ? 'asc' : 'desc' },
        select: { id: true, prioridad: true },
      })

      const priorityDelta = currentPriority < newPriority ? -1 : 1
      for (const column of columnsToShift) {
        await tx.columnaKanban.update({
          where: { id: column.id },
          data: { prioridad: column.prioridad + priorityDelta },
        })
      }

      return tx.columnaKanban.update({
        where: { id },
        data: { ...input, prioridad: newPriority },
      })
    })
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.columnaKanban.delete({ where: { id } })
  }

  async hardDeleteWithPriorityReorder(
    id: string,
    companyId: string,
    priority: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.tareaKanban.updateMany({
        where: { columnaKanbanId: id },
        data: { columnaKanbanId: null },
      })

      await tx.columnaKanban.delete({ where: { id } })

      const columnsToShift = await tx.columnaKanban.findMany({
        where: {
          companyId,
          status: ResourceStatus.ACTIVE,
          prioridad: { gt: priority },
        },
        orderBy: { prioridad: 'asc' },
        select: { id: true, prioridad: true },
      })

      for (const column of columnsToShift) {
        await tx.columnaKanban.update({
          where: { id: column.id },
          data: { prioridad: column.prioridad - 1 },
        })
      }
    })
  }
}
