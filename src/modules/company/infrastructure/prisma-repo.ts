import type { Prisma } from '@gen/client'
import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type { Company } from '../domain/entities'
import type { CompanyFilters, CompanyRepository } from '../domain/repository'

export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(pageable: Pageable, filters: CompanyFilters): Promise<Page<Company>> {
    const where: Prisma.CompanyWhereInput = {
      status: ResourceStatus.ACTIVE,
      ...(filters.rfc && { rfc: { contains: filters.rfc, mode: 'insensitive' } }),
      ...(filters.tipoPersona && { tipoPersona: filters.tipoPersona }),
      ...(filters.nombre && {
        OR: [
          { nombreComercial: { contains: filters.nombre, mode: 'insensitive' } },
          { razonSocial: { contains: filters.nombre, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.company.count({ where }),
    ])

    return Page.of(data, total, pageable)
  }

  async findById(id: string): Promise<Company | null> {
    return this.prisma.company.findFirst({
      where: { id, status: ResourceStatus.ACTIVE },
    })
  }
}
