import type { Prisma } from '@gen/client'
import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type { CreateRamoInput, Ramo, UpdateRamoInput } from '../domain/entities'
import type { RamoFilters, RamoRepository } from '../domain/repository'

export class PrismaRamoRepository implements RamoRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(pageable: Pageable, filters: RamoFilters): Promise<Page<Ramo>> {
    const where: Prisma.RamoWhereInput = {
      companyId: filters.companyId,
      status: ResourceStatus.ACTIVE,
      active: true,
      ...(filters.nombre && { nombre: { contains: filters.nombre, mode: 'insensitive' } }),
    }
    const [data, total] = await Promise.all([
      this.prisma.ramo.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.ramo.count({ where }),
    ])
    return Page.of(data, total, pageable)
  }

  async findById(id: string, companyId: string): Promise<Ramo | null> {
    return this.prisma.ramo.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE, active: true },
    })
  }

  async findByNombreAndCompany(nombre: string, companyId: string): Promise<Ramo | null> {
    return this.prisma.ramo.findFirst({
      where: { nombre, companyId, status: ResourceStatus.ACTIVE, active: true },
    })
  }

  async create(input: CreateRamoInput): Promise<Ramo> {
    return this.prisma.ramo.create({
      data: {
        companyId: input.companyId,
        nombre: input.nombre,
        descripcion: input.descripcion ?? null,
      },
    })
  }

  async update(id: string, input: UpdateRamoInput): Promise<Ramo> {
    return this.prisma.ramo.update({
      where: { id },
      data: input,
    })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.ramo.update({
      where: { id },
      data: { active: false },
    })
  }
}
