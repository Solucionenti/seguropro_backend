import type { Prisma } from '@gen/client'
import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type {
  CreateTareaKanbanInput,
  TareaKanban,
  UpdateTareaKanbanInput,
} from '../domain/entities'
import type { TareaKanbanFilters, TareaKanbanRepository } from '../domain/repository'

export class PrismaTareaKanbanRepository implements TareaKanbanRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(pageable: Pageable, filters: TareaKanbanFilters): Promise<Page<TareaKanban>> {
    const where: Prisma.TareaKanbanWhereInput = {
      companyId: filters.companyId,
      status: ResourceStatus.ACTIVE,
      ...(filters.columnaKanbanId && { columnaKanbanId: filters.columnaKanbanId }),
      ...(filters.polizaId && { polizaId: filters.polizaId }),
      ...(filters.titulo && { titulo: { contains: filters.titulo, mode: 'insensitive' } }),
    }
    const [data, total] = await Promise.all([
      this.prisma.tareaKanban.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.tareaKanban.count({ where }),
    ])
    return Page.of(data, total, pageable)
  }

  async findById(id: string, companyId: string): Promise<TareaKanban | null> {
    return this.prisma.tareaKanban.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE },
    })
  }

  async create(input: CreateTareaKanbanInput): Promise<TareaKanban> {
    return this.prisma.tareaKanban.create({ data: input })
  }

  async update(id: string, input: UpdateTareaKanbanInput): Promise<TareaKanban> {
    return this.prisma.tareaKanban.update({ where: { id }, data: input })
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.tareaKanban.delete({ where: { id } })
  }
}
