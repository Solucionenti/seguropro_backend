import type { Prisma } from '@gen/client'
import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type { CreateGlosarioInput, Glosario, UpdateGlosarioInput } from '../domain/entities'
import type { GlosarioFilters, GlosarioRepository } from '../domain/repository'

export class PrismaGlosarioRepository implements GlosarioRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(pageable: Pageable, filters: GlosarioFilters): Promise<Page<Glosario>> {
    const where: Prisma.GlosarioWhereInput = {
      companyId: filters.companyId,
      status: ResourceStatus.ACTIVE,
      active: true,
      ...(filters.titulo && { titulo: { contains: filters.titulo, mode: 'insensitive' } }),
    }

    const [data, total] = await Promise.all([
      this.prisma.glosario.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.glosario.count({ where }),
    ])

    return Page.of(data, total, pageable)
  }

  async findById(id: string, companyId: string): Promise<Glosario | null> {
    return this.prisma.glosario.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE, active: true },
    })
  }

  async findByTituloAndCompany(titulo: string, companyId: string): Promise<Glosario | null> {
    return this.prisma.glosario.findFirst({
      where: { titulo, companyId, status: ResourceStatus.ACTIVE, active: true },
    })
  }

  async create(input: CreateGlosarioInput): Promise<Glosario> {
    return this.prisma.glosario.create({ data: input })
  }

  async update(id: string, input: UpdateGlosarioInput): Promise<Glosario> {
    return this.prisma.glosario.update({ where: { id }, data: input })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.glosario.update({ where: { id }, data: { active: false } })
  }
}
