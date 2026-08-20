import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type {
  ArchivoPoliza,
  CreateArchivoPolizaInput,
  UpdateArchivoPolizaInput,
} from '../domain/entities'
import type { ArchivoPolizaRepository } from '../domain/repository'

export class PrismaArchivoPolizaRepository implements ArchivoPolizaRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAllByPoliza(polizaId: string, pageable: Pageable): Promise<Page<ArchivoPoliza>> {
    const where = { polizaId, status: ResourceStatus.ACTIVE, active: true }

    const [data, total] = await Promise.all([
      this.prisma.archivoPoliza.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.archivoPoliza.count({ where }),
    ])

    return Page.of(data, total, pageable)
  }

  async findByIdForPoliza(id: string, polizaId: string): Promise<ArchivoPoliza | null> {
    return this.prisma.archivoPoliza.findFirst({
      where: { id, polizaId, status: ResourceStatus.ACTIVE, active: true },
    })
  }

  async create(input: CreateArchivoPolizaInput): Promise<ArchivoPoliza> {
    return this.prisma.archivoPoliza.create({ data: input })
  }

  async update(id: string, input: UpdateArchivoPolizaInput): Promise<ArchivoPoliza> {
    return this.prisma.archivoPoliza.update({ where: { id }, data: input })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.archivoPoliza.update({ where: { id }, data: { active: false } })
  }
}
