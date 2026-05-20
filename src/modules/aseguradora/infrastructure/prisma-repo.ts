import type { Prisma } from '@gen/client'
import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type {
  Aseguradora,
  CreateAseguradoraInput,
  UpdateAseguradoraInput,
} from '../domain/entities'
import type { AseguradoraFilters, AseguradoraRepository } from '../domain/repository'

export class PrismaAseguradoraRepository implements AseguradoraRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(pageable: Pageable, filters: AseguradoraFilters): Promise<Page<Aseguradora>> {
    const where: Prisma.AseguradoraWhereInput = {
      companyId: filters.companyId,
      status: ResourceStatus.ACTIVE,
      active: true,
      ...(filters.nombre && { nombre: { contains: filters.nombre, mode: 'insensitive' } }),
    }
    const [data, total] = await Promise.all([
      this.prisma.aseguradora.findMany({
        where,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.aseguradora.count({ where }),
    ])
    return Page.of(data, total, pageable)
  }

  async findById(id: string, companyId: string): Promise<Aseguradora | null> {
    return this.prisma.aseguradora.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE, active: true },
    })
  }

  async findByNombreAndCompany(nombre: string, companyId: string): Promise<Aseguradora | null> {
    return this.prisma.aseguradora.findFirst({
      where: { nombre, companyId, status: ResourceStatus.ACTIVE, active: true },
    })
  }

  async create(input: CreateAseguradoraInput): Promise<Aseguradora> {
    return this.prisma.aseguradora.create({
      data: {
        companyId: input.companyId,
        nombre: input.nombre,
        descripcion: input.descripcion ?? null,
      },
    })
  }

  async update(id: string, input: UpdateAseguradoraInput): Promise<Aseguradora> {
    return this.prisma.aseguradora.update({
      where: { id },
      data: input,
    })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.aseguradora.update({
      where: { id },
      data: { active: false },
    })
  }
}
