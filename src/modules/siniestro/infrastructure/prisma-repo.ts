import type { Prisma } from '@gen/client'
import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type {
  CreateSiniestroInput,
  SiniestroWithDetails,
  UpdateSiniestroInput,
} from '../domain/entities'
import type { SiniestroFilters, SiniestroRepository } from '../domain/repository'

const polizaSelect = {
  id: true,
  companyId: true,
  numeroPoliza: true,
} as const

const userSelect = {
  id: true,
  companyId: true,
  firstName: true,
  lastName: true,
  email: true,
} as const

const includeDetails = {
  poliza: { select: polizaSelect },
  cliente: { select: userSelect },
  creadoPor: { select: userSelect },
} as const

export class PrismaSiniestroRepository implements SiniestroRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(
    pageable: Pageable,
    filters: SiniestroFilters,
  ): Promise<Page<SiniestroWithDetails>> {
    const where: Prisma.SiniestroWhereInput = {
      companyId: filters.companyId,
      status: ResourceStatus.ACTIVE,
      active: true,
      ...(filters.clienteUserId && { clienteUserId: filters.clienteUserId }),
      ...(filters.polizaId && { polizaId: filters.polizaId }),
      ...(filters.siniestroStatus && { siniestroStatus: filters.siniestroStatus }),
      ...(filters.tipoSiniestro && {
        tipoSiniestro: { contains: filters.tipoSiniestro, mode: 'insensitive' },
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.siniestro.findMany({
        where,
        include: includeDetails,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.siniestro.count({ where }),
    ])

    return Page.of(data, total, pageable)
  }

  async findById(
    id: string,
    companyId: string,
    clienteUserId?: string,
  ): Promise<SiniestroWithDetails | null> {
    return this.prisma.siniestro.findFirst({
      where: {
        id,
        companyId,
        status: ResourceStatus.ACTIVE,
        active: true,
        ...(clienteUserId && { clienteUserId }),
      },
      include: includeDetails,
    })
  }

  async create(input: CreateSiniestroInput): Promise<SiniestroWithDetails> {
    return this.prisma.siniestro.create({
      data: {
        companyId: input.companyId,
        polizaId: input.polizaId,
        clienteUserId: input.clienteUserId,
        creadoPorUserId: input.creadoPorUserId,
        fechaEvento: input.fechaEvento,
        tipoSiniestro: input.tipoSiniestro,
        descripcion: input.descripcion,
        ajustador: input.ajustador,
        montoEstimado: input.montoEstimado,
        ...(input.siniestroStatus && { siniestroStatus: input.siniestroStatus }),
      },
      include: includeDetails,
    })
  }

  async update(id: string, input: UpdateSiniestroInput): Promise<SiniestroWithDetails> {
    return this.prisma.siniestro.update({
      where: { id },
      data: input,
      include: includeDetails,
    })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.siniestro.update({
      where: { id },
      data: { active: false },
    })
  }
}
