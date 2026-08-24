import type { Prisma } from '@gen/client'
import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type {
  CreateHitoSiniestroInput,
  HitoSiniestroWithDetails,
  UpdateHitoSiniestroInput,
} from '../domain/entities'
import type { HitoFilters, HitoRepository } from '../domain/repository'

const asignadoSelect = {
  id: true,
  companyId: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
} as const

const includeDetails = { asignadoA: { select: asignadoSelect } } as const

export class PrismaHitoRepository implements HitoRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAllBySiniestro(
    pageable: Pageable,
    filters: HitoFilters,
  ): Promise<Page<HitoSiniestroWithDetails>> {
    const where: Prisma.HitoSiniestroWhereInput = {
      siniestroId: filters.siniestroId,
      status: ResourceStatus.ACTIVE,
      active: true,
      ...(filters.hitoStatus && { hitoStatus: filters.hitoStatus }),
      ...(filters.asignadoAUserId && { asignadoAUserId: filters.asignadoAUserId }),
    }

    const [data, total] = await Promise.all([
      this.prisma.hitoSiniestro.findMany({
        where,
        include: includeDetails,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.hitoSiniestro.count({ where }),
    ])

    return Page.of(data, total, pageable)
  }

  async findByIdForSiniestro(
    id: string,
    siniestroId: string,
  ): Promise<HitoSiniestroWithDetails | null> {
    return this.prisma.hitoSiniestro.findFirst({
      where: { id, siniestroId, status: ResourceStatus.ACTIVE, active: true },
      include: includeDetails,
    })
  }

  async create(input: CreateHitoSiniestroInput): Promise<HitoSiniestroWithDetails> {
    return this.prisma.hitoSiniestro.create({
      data: {
        siniestroId: input.siniestroId,
        tarea: input.tarea,
        fechaLimite: input.fechaLimite,
        descripcion: input.descripcion,
        asignadoAUserId: input.asignadoAUserId,
        ...(input.alerta !== undefined && { alerta: input.alerta }),
        ...(input.hitoStatus && { hitoStatus: input.hitoStatus }),
      },
      include: includeDetails,
    })
  }

  async update(id: string, input: UpdateHitoSiniestroInput): Promise<HitoSiniestroWithDetails> {
    return this.prisma.hitoSiniestro.update({
      where: { id },
      data: input,
      include: includeDetails,
    })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.hitoSiniestro.update({ where: { id }, data: { active: false } })
  }
}
