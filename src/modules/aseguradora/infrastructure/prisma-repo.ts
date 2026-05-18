import type { Prisma } from '@gen/client'
import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type {
  Aseguradora,
  CreateAseguradoraInput,
  UpdateAseguradoraInput,
} from '../domain/entities'
import type { AseguradoraRepository } from '../domain/repository'

export class PrismaAseguradoraRepository implements AseguradoraRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(
    companyId: string,
    page: number,
    pageSize: number,
    nombre?: string,
  ): Promise<{ data: Aseguradora[]; total: number }> {
    const where: Prisma.AseguradoraWhereInput = {
      companyId,
      status: ResourceStatus.ACTIVE,
      active: true,
      ...(nombre && { nombre: { contains: nombre, mode: 'insensitive' } }),
    }
    const [data, total] = await Promise.all([
      this.prisma.aseguradora.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aseguradora.count({ where }),
    ])
    return { data, total }
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
