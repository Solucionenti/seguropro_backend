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

  async hardDelete(id: string): Promise<void> {
    await this.prisma.columnaKanban.delete({ where: { id } })
  }
}
