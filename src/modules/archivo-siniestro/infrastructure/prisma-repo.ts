import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type {
  ArchivoSiniestro,
  CreateArchivoSiniestroInput,
  UpdateArchivoSiniestroInput,
} from '../domain/entities'
import type { ArchivoSiniestroRepository } from '../domain/repository'

export class PrismaArchivoSiniestroRepository implements ArchivoSiniestroRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAllBySiniestro(
    siniestroId: string,
    pageable: Pageable,
  ): Promise<Page<ArchivoSiniestro>> {
    const where = { siniestroId, status: ResourceStatus.ACTIVE, active: true }

    const [data, total] = await Promise.all([
      this.prisma.archivoSiniestro.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.archivoSiniestro.count({ where }),
    ])

    return Page.of(data, total, pageable)
  }

  async findByIdForSiniestro(id: string, siniestroId: string): Promise<ArchivoSiniestro | null> {
    return this.prisma.archivoSiniestro.findFirst({
      where: { id, siniestroId, status: ResourceStatus.ACTIVE, active: true },
    })
  }

  async create(input: CreateArchivoSiniestroInput): Promise<ArchivoSiniestro> {
    return this.prisma.archivoSiniestro.create({ data: input })
  }

  async update(id: string, input: UpdateArchivoSiniestroInput): Promise<ArchivoSiniestro> {
    return this.prisma.archivoSiniestro.update({ where: { id }, data: input })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.archivoSiniestro.update({ where: { id }, data: { active: false } })
  }
}
